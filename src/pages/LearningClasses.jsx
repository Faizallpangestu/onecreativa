import { useCallback, useEffect, useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  Users,
  User,
  BookOpen,
  ClipboardList,
  Search,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  Plus,
  Eye,
  MoreHorizontal,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  UserPlus,
  GraduationCap
} from 'lucide-react';
import Layout from '../components/Layout';
import { FormField, fieldClass } from '../components/ModuleFrame';
import { moduleApi } from '../utils/moduleApi';

// Thumbnail presets for Japanese cultural scenery
import osakaCastleImg from '../assets/osaka_castle.jpg';
import kyotoStreetImg from '../assets/kyoto_street.jpg';
import fujiBgImg from '../assets/login_bg_fuji.jpg';
import toriiGateSunsetImg from '../assets/torii_gate_sunset.jpg';
import japaneseLanternImg from '../assets/japanese_lantern_street.jpg';
import classroomBgImg from '../assets/lms_belajar_bg.png';

const thumbnailList = [
  fujiBgImg,
  osakaCastleImg,
  kyotoStreetImg,
  toriiGateSunsetImg,
  japaneseLanternImg,
  classroomBgImg
];



const initialClass = {
  id: '',
  code: '',
  name: '',
  program_code: 'INTENSIF',
  batch: 'Batch 1 2026',
  level: 'N5',
  schedule_days: 'Senin & Rabu',
  schedule_time: '08:00 - 09:30',
  total_meetings: 32,
  completed_meetings: 0,
  status: 'active'
};

const initialAssignment = {
  class_id: '',
  sensei_user_id: '',
  starts_on: '',
  ends_on: ''
};

const initialEnrollment = {
  class_id: '',
  student_id: '',
  joined_on: '',
  left_on: '',
  status: 'active'
};

export default function LearningClasses() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Filters & View State
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('2026');
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table' | 'relations'
  const [sortBy, setSortBy] = useState('latest');

  // Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [classForm, setClassForm] = useState(initialClass);

  const [detailClass, setDetailClass] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Assignment & Enrollment Modals
  const [assignModal, setAssignModal] = useState(null); // class object or null
  const [enrollModal, setEnrollModal] = useState(null); // class object or null
  const [assignForm, setAssignForm] = useState(initialAssignment);
  const [enrollForm, setEnrollForm] = useState(initialEnrollment);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await moduleApi('relationships');
      setData(res);
    } catch (e) {
      setError(e.message || 'Gagal memuat data kelas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Derived list of classes with enriched visual metadata
  const enrichedClasses = useMemo(() => {
    if (!data?.classes) {
      return [];
    }

    return data.classes.map((cls, idx) => {
      // Find sensei assigned
      const assignment = data.assignments?.find(
        (a) => Number(a.class_id) === Number(cls.id) && (!a.ends_on || new Date(a.ends_on) >= new Date())
      );
      const sensei = data.senseis?.find((s) => Number(s.id) === Number(assignment?.sensei_user_id));

      // Find students enrolled
      const enrollments = data.enrollments?.filter(
        (e) => Number(e.class_id) === Number(cls.id) && e.status === 'active'
      ) || [];

      // Thumbnail assignment
      const thumbnail = cls.thumbnail || thumbnailList[idx % thumbnailList.length];

      // Schedule presets
      const scheduleDays = cls.schedule_days || (idx % 2 === 0 ? 'Senin & Rabu' : 'Selasa & Kamis');
      const scheduleTime = cls.schedule_time || (idx % 2 === 0 ? '08:00 - 09:30' : '10:00 - 11:30');
      const totalMeetings = Number(cls.total_meetings) > 0 ? Number(cls.total_meetings) : 32;
      const completedMeetings = cls.completed_meetings !== null && cls.completed_meetings !== undefined && cls.completed_meetings !== ''
        ? Number(cls.completed_meetings)
        : (Number(cls.meeting_logs_count) || 0);
      const matchingBatchStudents = (data?.students || []).filter(
        (s) => s.batch && cls.batch && s.batch.trim().toLowerCase() === cls.batch.trim().toLowerCase()
      );
      const studentCount = enrollments.length > 0
        ? enrollments.length
        : (Number(cls.enrolled_students_count) || matchingBatchStudents.length || 0);
      const level = cls.level || (idx < 2 ? 'N5' : idx < 4 ? 'N4' : idx === 4 ? 'N3' : idx === 5 ? 'Kaiwa' : idx === 6 ? 'Bunpou' : 'JLPT');

      const badgeColor =
        level === 'N5'
          ? 'bg-[#0066FF]'
          : level === 'N4'
          ? 'bg-[#651FFF]'
          : level === 'N3'
          ? 'bg-[#0066FF]'
          : level === 'Bunpou'
          ? 'bg-[#651FFF]'
          : 'bg-[#1E293B]';

      return {
        ...cls,
        sensei_name: assignment?.sensei_name || sensei?.name || 'Belum Ditugaskan',
        student_count: studentCount,
        enrollments,
        thumbnail,
        badgeColor,
        schedule_days: scheduleDays,
        schedule_time: scheduleTime,
        total_meetings: totalMeetings,
        completed_meetings: completedMeetings,
        level
      };
    });
  }, [data]);

  // Filtered & Sorted Classes
  const filteredClasses = useMemo(() => {
    let result = enrichedClasses.filter((c) => {
      const matchSearch = `${c.name} ${c.code} ${c.level} ${c.batch} ${c.sensei_name}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchLevel = levelFilter === 'ALL' || c.level === levelFilter;
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'Aktif'
          ? c.status === 'active'
          : statusFilter === 'Selesai'
          ? c.status === 'completed' || c.status === 'closed'
          : c.status === 'draft' || c.status === 'inactive';
      const matchYear = yearFilter === 'ALL' || (c.batch && c.batch.includes(yearFilter));

      return matchSearch && matchLevel && matchStatus && matchYear;
    });

    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'students') {
      result.sort((a, b) => b.student_count - a.student_count);
    } else {
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    return result;
  }, [enrichedClasses, search, levelFilter, statusFilter, yearFilter, sortBy]);

  // Dynamic Metrics from real database & active classes
  const totalKelasCount = data?.stats?.total_classes ?? enrichedClasses.length;
  const activeKelasCount = data?.stats?.active_classes ?? enrichedClasses.filter(c => c.status === 'active').length;
  const totalSiswaCount = useMemo(() => {
    if (data?.stats?.total_students !== undefined && data.stats.total_students > 0) {
      return data.stats.total_students;
    }
    const enrolledSum = enrichedClasses.reduce((acc, c) => acc + (Number(c.student_count) || 0), 0);
    if (enrolledSum > 0) return enrolledSum;
    if (data?.students?.length) return data.students.length;
    return 0;
  }, [data, enrichedClasses]);
  const totalPertemuanCount = data?.stats?.total_meetings 
    ?? enrichedClasses.reduce((acc, c) => acc + (Number(c.completed_meetings) || 0), 0);
  const completedPertemuanCount = data?.stats?.completed_meetings 
    ?? enrichedClasses.reduce((acc, c) => acc + (Number(c.completed_meetings) || 0), 0);
  const totalTugasCount = data?.stats?.total_tasks ?? 0;

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setLevelFilter('ALL');
    setStatusFilter('ALL');
    setYearFilter('2026');
    setSortBy('latest');
  };

  // Open Create Class Modal
  const openCreateClassModal = () => {
    setIsEditMode(false);
    setClassForm({
      ...initialClass,
      code: `CLS-${Date.now().toString().slice(-4)}`,
      batch: 'Batch 1 2026'
    });
    setIsClassModalOpen(true);
  };

  // Open Edit Class Modal
  const openEditClassModal = (cls) => {
    setIsEditMode(true);
    setClassForm({
      id: cls.id,
      code: cls.code || '',
      name: cls.name || '',
      program_code: cls.program_code || 'INTENSIF',
      batch: cls.batch || 'Batch 1 2026',
      level: cls.level || 'N5',
      schedule_days: cls.schedule_days || 'Senin & Rabu',
      schedule_time: cls.schedule_time || '08:00 - 09:30',
      total_meetings: cls.total_meetings || 32,
      completed_meetings: cls.completed_meetings || 0,
      status: cls.status || 'active'
    });
    setIsClassModalOpen(true);
    setActiveMenuId(null);
  };

  // Save Class (Create or Update)
  const handleSaveClass = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const rawId = classForm.id;
      const validId = isEditMode && rawId && !String(rawId).startsWith('mock-') && !isNaN(Number(rawId)) ? Number(rawId) : null;

      await moduleApi('relationships', 'post', {
        ...classForm,
        id: validId,
        action: 'class'
      });
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: isEditMode ? 'Kelas berhasil diperbarui.' : 'Kelas baru berhasil dibuat.',
        timer: 1500,
        showConfirmButton: false
      });
      setIsClassModalOpen(false);
      await refresh();
    } catch (err) {
      Swal.fire('Gagal', err.message || 'Gagal menyimpan kelas.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Class Handler
  const handleDeleteClass = async (cls) => {
    setActiveMenuId(null);
    setDetailClass(null);

    const result = await Swal.fire({
      title: 'Hapus Kelas?',
      html: `Apakah Anda yakin ingin menghapus kelas <b>${cls.name}</b> secara permanen?<br><span class="text-xs text-rose-500 font-medium">Tindakan ini permanen dan data kelas akan dihapus dari sistem.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Ya, Hapus Permanen',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    // Remove from local state immediately
    setData((prev) => {
      if (!prev || !prev.classes) return prev;
      return {
        ...prev,
        classes: prev.classes.filter((c) => String(c.id) !== String(cls.id))
      };
    });

    try {
      if (!String(cls.id).startsWith('mock-')) {
        await moduleApi('relationships', 'post', {
          id: cls.id,
          action: 'delete_class'
        });
      }
      Swal.fire({
        icon: 'success',
        title: 'Berhasil Dihapus',
        text: `Kelas ${cls.name} telah berhasil dihapus secara permanen.`,
        timer: 1500,
        showConfirmButton: false
      });
      await refresh();
    } catch (err) {
      Swal.fire('Gagal', err.message || 'Gagal menghapus kelas.', 'error');
      await refresh();
    }
  };

  // Assign Sensei Handler
  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await moduleApi('relationships', 'post', {
        ...assignForm,
        class_id: assignModal.id,
        action: 'assignment'
      });
      Swal.fire('Berhasil', 'Sensei berhasil ditugaskan ke kelas.', 'success');
      setAssignModal(null);
      await refresh();
    } catch (err) {
      Swal.fire('Gagal', err.message || 'Gagal menugaskan sensei.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Enroll Student Handler
  const handleSaveEnrollment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await moduleApi('relationships', 'post', {
        ...enrollForm,
        class_id: enrollModal.id,
        action: 'enrollment'
      });
      Swal.fire('Berhasil', 'Siswa berhasil didaftarkan ke kelas.', 'success');
      setEnrollModal(null);
      await refresh();
    } catch (err) {
      Swal.fire('Gagal', err.message || 'Gagal mendaftarkan siswa.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Auto Enroll All Students in Class Batch
  const handleAutoEnrollBatch = async (classObj) => {
    if (!classObj?.batch) {
      Swal.fire('Informasi', 'Kelas ini belum memiliki informasi Batch.', 'info');
      return;
    }
    setSaving(true);
    try {
      const res = await moduleApi('relationships', 'post', {
        class_id: classObj.id,
        action: 'auto_enroll_batch'
      });
      Swal.fire({
        icon: 'success',
        title: 'Siswa Berhasil Ditarik',
        html: `Berhasil mendaftarkan <b>${res.enrolled_count || 0} siswa baru</b> dari batch <b>${classObj.batch}</b> ke kelas ini.<br><span class="text-xs text-slate-500">Total siswa di batch ini: ${res.total_batch_students || 0} siswa</span>`
      });
      setEnrollModal(null);
      await refresh();
    } catch (err) {
      Swal.fire('Gagal', err.message || 'Gagal menarik data siswa sesuai batch.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

          {/* PAGE HEADER */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Daftar Kelas
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Kelola kelas yang Anda ajar dan pantau aktivitas siswa.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateClassModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#0066FF] hover:bg-blue-600 active:scale-[0.98] text-white font-bold text-xs sm:text-sm px-5 py-3 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Buat Kelas Baru</span>
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-2xl flex items-center justify-between shadow-sm">
              <span>{error}</span>
              <button type="button" onClick={refresh} className="font-bold underline hover:text-rose-900 cursor-pointer">
                Coba Lagi
              </button>
            </div>
          )}

          {loading && !data && (
            <div className="h-1 w-full bg-blue-100 overflow-hidden rounded-full">
              <div className="h-full bg-blue-600 animate-pulse w-2/3" />
            </div>
          )}

          {/* 4 TOP STATS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Kelas */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0066FF] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400">Total Kelas</div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-slate-900">{totalKelasCount}</span>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                    {activeKelasCount} <span className="text-slate-400 font-normal">aktif</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Total Siswa */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#00C853] text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                <User className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400">Total Siswa</div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-slate-900">{totalSiswaCount}</span>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                    {data?.students?.length || totalSiswaCount} <span className="text-slate-400 font-normal">terdaftar</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Total Pertemuan */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#651FFF] text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400">Total Pertemuan</div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-slate-900">{totalPertemuanCount}</span>
                  <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-0.5">
                    {completedPertemuanCount} <span className="text-slate-400 font-normal">selesai</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Tugas Dibuat */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FF9100] text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <ClipboardList className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400">Tugas Dibuat</div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-slate-900">{totalTugasCount}</span>
                  <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
                    {totalTugasCount} <span className="text-slate-400 font-normal">tugas & quiz</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER BAR */}
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative min-w-[260px] flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama kelas, level, atau sensei..."
                className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Level Filter */}
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="bg-white border border-slate-200/90 rounded-2xl py-2.5 px-4 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">Semua Level</option>
                <option value="N5">Level N5</option>
                <option value="N4">Level N4</option>
                <option value="N3">Level N3</option>
                <option value="Kaiwa">Kaiwa (Percakapan)</option>
                <option value="Bunpou">Bunpou (Tata Bahasa)</option>
                <option value="JLPT">Persiapan JLPT</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200/90 rounded-2xl py-2.5 px-4 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Selesai">Selesai</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>

              {/* Year Filter */}
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="bg-white border border-slate-200/90 rounded-2xl py-2.5 px-4 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">Semua Tahun</option>
                <option value="2026">Tahun 2026</option>
                <option value="2025">Tahun 2025</option>
              </select>

              {/* Reset Button */}
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl py-2.5 px-3.5 text-xs font-bold text-slate-600 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* SECTION HEADER & VIEW CONTROLS */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Daftar Kelas</h2>
              <p className="text-xs text-slate-400 font-medium">
                Menampilkan {filteredClasses.length} kelas
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Card / Table Switcher */}
              <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200/60 flex items-center">
                <button
                  type="button"
                  onClick={() => setViewMode('card')}
                  className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'card'
                      ? 'bg-[#0066FF] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-[#0066FF] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Tabel</span>
                </button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-slate-200 rounded-2xl py-2 px-3 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs focus:outline-none"
              >
                <option value="latest">Terbaru</option>
                <option value="name">Nama A-Z</option>
                <option value="students">Siswa Terbanyak</option>
              </select>
            </div>
          </div>

          {/* MAIN CONTENT: CARD GRID OR TABLE */}
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredClasses.length === 0 ? (
                <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Tidak ada kelas yang sesuai</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Coba sesuaikan kata kunci pencarian atau reset filter level &amp; status kelas.
                  </p>
                  <button
                    type="button"
                    onClick={openCreateClassModal}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0066FF] text-white font-bold text-xs px-4 py-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Kelas Baru</span>
                  </button>
                </div>
              ) : (
                filteredClasses.map((cls) => {
                  const percent = Math.min(
                    100,
                    Math.round((cls.completed_meetings / (cls.total_meetings || 32)) * 100)
                  );
                  const isFinished = cls.status === 'completed' || percent === 100;
                  const isDraft = cls.status === 'draft' || cls.status === 'inactive';

                  return (
                    <div
                      key={cls.id}
                      className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                    >
                      {/* Top Thumbnail Image with Badges */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                        <img
                          src={cls.thumbnail}
                          alt={cls.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

                        {/* Top Left Level Badge */}
                        <div className="absolute top-3 left-3">
                          <span className={`px-2.5 py-1 rounded-lg ${cls.badgeColor || 'bg-[#0066FF]'} text-white font-black text-[11px] shadow-sm uppercase tracking-wider`}>
                            {cls.level}
                          </span>
                        </div>

                        {/* Bottom Right Status Badge (Exact Mockup Match) */}
                        <div className="absolute bottom-3 right-3">
                          {isFinished ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 text-amber-600 font-bold text-[10px] shadow-sm border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Selesai
                            </span>
                          ) : isDraft ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 text-slate-600 font-bold text-[10px] shadow-sm border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Nonaktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 text-emerald-600 font-bold text-[10px] shadow-sm border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Aktif
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content Body */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Class Title */}
                          <h3 className="font-extrabold text-slate-900 text-[15px] tracking-tight leading-snug line-clamp-1 mb-2.5">
                            {cls.name}
                          </h3>

                          {/* Meta Row 1: Students & Meetings */}
                          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mb-2">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>{cls.student_count} siswa</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{cls.total_meetings} pertemuan</span>
                            </div>
                          </div>

                          {/* Meta Row 2: Sensei Pengajar & Batch */}
                          <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2 gap-2">
                            <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                              <GraduationCap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="font-semibold text-slate-800 truncate" title={cls.sensei_name}>
                                {cls.sensei_name}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 shrink-0 border border-blue-100/80">
                              {cls.batch || 'Tanpa Batch'}
                            </span>
                          </div>

                          {/* Meta Row 3: Schedule Days & Time */}
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-4">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {cls.schedule_days} | {cls.schedule_time}
                            </span>
                          </div>
                        </div>

                        {/* Progress Section */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex justify-between items-center text-[11px] font-bold mb-1.5">
                            <span className="text-slate-400">Progress Pertemuan</span>
                            <span className="text-slate-700">
                              {cls.completed_meetings} / {cls.total_meetings}
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                cls.progressColor || (isFinished ? 'bg-[#00C853]' : percent > 60 ? 'bg-[#651FFF]' : 'bg-[#0066FF]')
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="text-right text-[10px] font-extrabold text-blue-600 mt-1">
                            {percent}%
                          </div>
                        </div>

                        {/* Action Buttons Footer */}
                        <div className="flex items-center justify-between gap-2 pt-3 mt-1 relative">
                          <button
                            type="button"
                            onClick={() => setDetailClass(cls)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl bg-blue-50/80 hover:bg-blue-100 text-[#0066FF] font-bold text-xs transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Detail</span>
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuId(activeMenuId === cls.id ? null : cls.id)
                              }
                              className="w-8 h-8 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Dropdown Options */}
                            {activeMenuId === cls.id && (
                              <div className="absolute right-0 bottom-full mb-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  type="button"
                                  onClick={() => openEditClassModal(cls)}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Edit Kelas</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentAssignment = data?.assignments?.find(
                                      (a) => Number(a.class_id) === Number(cls.id) && (!a.ends_on || new Date(a.ends_on) >= new Date())
                                    );
                                    setAssignModal(cls);
                                    setAssignForm({
                                      class_id: cls.id,
                                      sensei_user_id: currentAssignment?.sensei_user_id || '',
                                      starts_on: currentAssignment?.starts_on || new Date().toISOString().slice(0, 10),
                                      ends_on: currentAssignment?.ends_on || ''
                                    });
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer"
                                >
                                  <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Atur Sensei</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEnrollModal(cls);
                                    setEnrollForm({
                                      class_id: cls.id,
                                      student_id: '',
                                      joined_on: new Date().toISOString().slice(0, 10),
                                      left_on: '',
                                      status: 'active'
                                    });
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer"
                                >
                                  <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Daftarkan Siswa</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteClass(cls)}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 cursor-pointer border-t border-slate-100 mt-1 pt-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Hapus Kelas</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                      <th className="py-4 px-5">Kode &amp; Nama Kelas</th>
                      <th className="py-4 px-5">Level &amp; Batch</th>
                      <th className="py-4 px-5">Sensei Pengajar</th>
                      <th className="py-4 px-5">Jadwal Kelas</th>
                      <th className="py-4 px-5 text-center">Siswa</th>
                      <th className="py-4 px-5">Progress</th>
                      <th className="py-4 px-5 text-center">Status</th>
                      <th className="py-4 px-5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClasses.map((cls) => {
                      const percent = Math.min(
                        100,
                        Math.round((cls.completed_meetings / (cls.total_meetings || 32)) * 100)
                      );
                      return (
                        <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-5">
                            <div className="font-extrabold text-slate-900 text-sm">{cls.name}</div>
                            <div className="text-[11px] text-slate-400 font-semibold">{cls.code}</div>
                          </td>

                          <td className="py-4 px-5">
                            <span className="inline-block px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-black text-[11px] mb-0.5">
                              {cls.level}
                            </span>
                            <div className="text-[11px] text-slate-500 font-medium">{cls.batch}</div>
                          </td>

                          <td className="py-4 px-5 font-semibold text-slate-700">
                            {cls.sensei_name}
                          </td>

                          <td className="py-4 px-5">
                            <div className="font-semibold text-slate-800">{cls.schedule_days}</div>
                            <div className="text-[11px] text-slate-400">{cls.schedule_time}</div>
                          </td>

                          <td className="py-4 px-5 text-center font-bold text-slate-800">
                            {cls.student_count}
                          </td>

                          <td className="py-4 px-5 w-44">
                            <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                              <span>{cls.completed_meetings}/{cls.total_meetings}</span>
                              <span className="text-blue-600">{percent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#0066FF] h-full rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </td>

                          <td className="py-4 px-5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Aktif
                            </span>
                          </td>

                          <td className="py-4 px-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setDetailClass(cls)}
                                className="p-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditClassModal(cls)}
                                className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                title="Edit Kelas"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClass(cls)}
                                className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                title="Hapus Kelas"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODAL: BUAT / EDIT KELAS */}
          {isClassModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full cursor-pointer hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      {isEditMode ? 'Edit Data Kelas' : 'Buat Kelas Baru'}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Konfigurasi nama kelas, program, dan jadwal pertemuan.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveClass} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kode Kelas <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={classForm.code}
                        onChange={(e) => setClassForm({ ...classForm, code: e.target.value.toUpperCase() })}
                        placeholder="Contoh: N5-A"
                        className={fieldClass}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Level Bahasa <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={classForm.level}
                        onChange={(e) => setClassForm({ ...classForm, level: e.target.value })}
                        className={fieldClass}
                      >
                        <option value="N5">Level N5</option>
                        <option value="N4">Level N4</option>
                        <option value="N3">Level N3</option>
                        <option value="Kaiwa">Kaiwa</option>
                        <option value="Bunpou">Bunpou</option>
                        <option value="JLPT">JLPT</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Kelas <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={classForm.name}
                      onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                      placeholder="Contoh: N5 A - Pagi"
                      className={fieldClass}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Batch / Angkatan</label>
                      <input
                        type="text"
                        list="class-batch-list"
                        value={classForm.batch}
                        onChange={(e) => setClassForm({ ...classForm, batch: e.target.value })}
                        placeholder="Contoh: BATCH 2"
                        className={fieldClass}
                      />
                      <datalist id="class-batch-list">
                        {(data?.available_batches || ['BATCH 2', 'Batch 1 2026']).map((b) => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Program</label>
                      <input
                        type="text"
                        value={classForm.program_code}
                        onChange={(e) => setClassForm({ ...classForm, program_code: e.target.value })}
                        placeholder="Program Intensif"
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hari Pertemuan</label>
                      <input
                        type="text"
                        value={classForm.schedule_days}
                        onChange={(e) => setClassForm({ ...classForm, schedule_days: e.target.value })}
                        placeholder="Senin & Rabu"
                        className={fieldClass}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Jam Belajar</label>
                      <input
                        type="text"
                        value={classForm.schedule_time}
                        onChange={(e) => setClassForm({ ...classForm, schedule_time: e.target.value })}
                        placeholder="08:00 - 09:30"
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Target Pertemuan</label>
                      <input
                        type="number"
                        min="1"
                        value={classForm.total_meetings}
                        onChange={(e) => setClassForm({ ...classForm, total_meetings: parseInt(e.target.value, 10) || 32 })}
                        className={fieldClass}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pertemuan Selesai</label>
                      <input
                        type="number"
                        min="0"
                        max={classForm.total_meetings || 100}
                        value={classForm.completed_meetings !== undefined ? classForm.completed_meetings : 0}
                        onChange={(e) => setClassForm({ ...classForm, completed_meetings: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0 })}
                        className={fieldClass}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Status Kelas</label>
                      <select
                        value={classForm.status}
                        onChange={(e) => setClassForm({ ...classForm, status: e.target.value })}
                        className={fieldClass}
                      >
                        <option value="active">Aktif</option>
                        <option value="draft">Draft / Persiapan</option>
                        <option value="closed">Selesai / Ditutup</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                    {isEditMode ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsClassModalOpen(false);
                          handleDeleteClass(classForm);
                        }}
                        className="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Kelas</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsClassModalOpen(false)}
                        className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 rounded-2xl bg-[#0066FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer"
                      >
                        {saving ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Buat Kelas'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: DETAIL KELAS */}
          {detailClass && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative">
                <button
                  type="button"
                  onClick={() => setDetailClass(null)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full cursor-pointer hover:bg-slate-100 z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Cover Image with Badges */}
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-5 shadow-sm bg-slate-100">
                  <img
                    src={detailClass.thumbnail}
                    alt={detailClass.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
                  
                  {/* Level Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-lg ${detailClass.badgeColor || 'bg-[#0066FF]'} text-white font-black text-xs shadow-sm uppercase tracking-wider`}>
                      {detailClass.level}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute bottom-3 right-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 font-bold text-xs shadow-md border ${
                      detailClass.status === 'completed' || detailClass.status === 'closed'
                        ? 'text-amber-600 border-amber-200'
                        : detailClass.status === 'inactive'
                        ? 'text-slate-600 border-slate-200'
                        : 'text-emerald-600 border-emerald-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        detailClass.status === 'completed' || detailClass.status === 'closed'
                          ? 'bg-amber-500'
                          : detailClass.status === 'inactive'
                          ? 'bg-slate-400'
                          : 'bg-emerald-500'
                      }`} />
                      {detailClass.status === 'completed' || detailClass.status === 'closed'
                        ? 'Selesai'
                        : detailClass.status === 'inactive'
                        ? 'Nonaktif'
                        : 'Aktif'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                      {detailClass.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {detailClass.code} · {detailClass.batch || 'Batch 1 2026'} · {detailClass.program_code || 'Program Intensif'}
                    </p>
                  </div>
                </div>

                {/* Information Card */}
                <div className="bg-slate-50/80 rounded-2xl p-4 space-y-2.5 text-xs border border-slate-100 my-4">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      Sensei Pengajar
                    </span>
                    <span className="font-bold text-slate-900">{detailClass.sensei_name}</span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Jadwal Belajar
                    </span>
                    <span className="font-bold text-slate-900">
                      {detailClass.schedule_days} | {detailClass.schedule_time}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Total Siswa Terdaftar
                    </span>
                    <span className="font-bold text-slate-900">{detailClass.student_count} Siswa</span>
                  </div>

                  <div className="pt-1">
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Progress Pertemuan
                      </span>
                      <span className="font-black text-blue-600">
                        {detailClass.completed_meetings} / {detailClass.total_meetings} Pertemuan ({Math.min(100, Math.round((detailClass.completed_meetings / (detailClass.total_meetings || 32)) * 100))}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          detailClass.progressColor || 'bg-[#0066FF]'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.round((detailClass.completed_meetings / (detailClass.total_meetings || 32)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteClass(detailClass)}
                    className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors cursor-pointer"
                    title="Hapus Kelas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAssignModal(detailClass);
                      setAssignForm({
                        class_id: detailClass.id,
                        sensei_user_id: '',
                        starts_on: '',
                        ends_on: ''
                      });
                      setDetailClass(null);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Atur Sensei
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      openEditClassModal(detailClass);
                      setDetailClass(null);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-blue-50 text-[#0066FF] hover:bg-blue-100 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Edit Kelas
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailClass(null)}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-[#0066FF] text-white hover:bg-blue-600 font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: ATUR SENSEI ASSIGNMENT */}
          {assignModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-black text-slate-900 mb-1">Tugaskan Sensei</h3>
                <p className="text-xs text-slate-400 mb-4">Kelas: {assignModal.name}</p>

                <form onSubmit={handleSaveAssignment} className="space-y-4">
                  <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3 text-xs text-purple-800">
                    <span className="font-bold block mb-0.5">Sensei dari Hak Akses:</span>
                    <span>Pilihan sensei diambil langsung dari akun aktif pada menu <b>Hak Akses Sensei LMS</b>.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilih Sensei Pengajar
                    </label>
                    <select
                      required
                      value={assignForm.sensei_user_id}
                      onChange={(e) => setAssignForm({ ...assignForm, sensei_user_id: e.target.value })}
                      className={fieldClass}
                    >
                      <option value="">Pilih Sensei...</option>
                      {data?.senseis?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.email ? `(${s.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                      <input
                        type="date"
                        required
                        value={assignForm.starts_on}
                        onChange={(e) => setAssignForm({ ...assignForm, starts_on: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai</label>
                      <input
                        type="date"
                        value={assignForm.ends_on}
                        onChange={(e) => setAssignForm({ ...assignForm, ends_on: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setAssignModal(null)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 rounded-xl bg-[#0066FF] text-white text-xs font-bold"
                    >
                      Simpan Penugasan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: DAFTARKAN SISWA (ENROLLMENT) */}
          {enrollModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
                <button
                  type="button"
                  onClick={() => setEnrollModal(null)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-black text-slate-900 mb-1">Daftarkan Siswa ke Kelas</h3>
                <p className="text-xs text-slate-400 mb-4">Kelas: {enrollModal.name}</p>

                <form onSubmit={handleSaveEnrollment} className="space-y-4">
                  {/* Batch Smart Match Banner */}
                  <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="text-[11px] font-bold text-blue-600 block">Batch Kelas Ini:</span>
                      <span className="text-xs font-black text-slate-800">{enrollModal.batch || 'Belum Ditentukan'}</span>
                    </div>
                    {enrollModal.batch && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleAutoEnrollBatch(enrollModal)}
                        className="px-3 py-1.5 rounded-xl bg-[#0066FF] hover:bg-blue-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 self-end sm:self-auto"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Tarik Semua Siswa Batch Ini</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Pilih Siswa
                    </label>
                    <select
                      required
                      value={enrollForm.student_id}
                      onChange={(e) => setEnrollForm({ ...enrollForm, student_id: e.target.value })}
                      className={fieldClass}
                    >
                      <option value="">Pilih Siswa...</option>
                      {(() => {
                        const allStudents = data?.students || [];
                        const isMatching = (s) => s.batch && enrollModal.batch && s.batch.trim().toLowerCase() === enrollModal.batch.trim().toLowerCase();
                        const matching = allStudents.filter(isMatching);
                        const others = allStudents.filter((s) => !isMatching(s));

                        return (
                          <>
                            {matching.length > 0 && (
                              <optgroup label={`⭐ Siswa Sesuai Batch (${enrollModal.batch})`}>
                                {matching.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    ⭐ {s.name} · {s.batch}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <optgroup label="Semua Siswa Lainnya">
                              {others.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} · {s.batch || 'Tanpa Batch'}
                                </option>
                              ))}
                            </optgroup>
                          </>
                        );
                      })()}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Bergabung</label>
                      <input
                        type="date"
                        required
                        value={enrollForm.joined_on}
                        onChange={(e) => setEnrollForm({ ...enrollForm, joined_on: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                      <select
                        value={enrollForm.status}
                        onChange={(e) => setEnrollForm({ ...enrollForm, status: e.target.value })}
                        className={fieldClass}
                      >
                        <option value="active">Aktif</option>
                        <option value="completed">Selesai</option>
                        <option value="withdrawn">Mengundurkan Diri</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setEnrollModal(null)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 rounded-xl bg-[#0066FF] text-white text-xs font-bold"
                    >
                      Daftarkan Siswa
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
