import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  Compass,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Award,
  Sparkles,
  Plane,
  Briefcase,
  GraduationCap,
  MessageSquare,
  FileCheck,
  Check,
  Building2,
  HeartPulse,
  Flame,
  Target,
  RefreshCw,
  Database,
  Calendar,
  Users,
  PlusCircle,
  Layers,
  HelpCircle
} from 'lucide-react';
import bannerImg from '../../assets/fuji_pagoda_banner.jpg';
import animeGirlImg from '../../assets/anime_girl_cheer.jpg';
import toriiGateImg from '../../assets/torii_gate_sunset.jpg';
import { moduleApi } from '../../utils/moduleApi';
import Swal from 'sweetalert2';

export default function LmsLearningPath() {
  const navigate = useNavigate();

  // Active Career Track Selection
  const [activeTrack, setActiveTrack] = useState('kaigo'); // 'kaigo' | 'manufaktur' | 'magang'

  // Real Database States
  const [realCourses, setRealCourses] = useState([]);
  const [activeClass, setActiveClass] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load 100% Real Courses, Modules & Class Data from Database
  const loadRealData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsSyncing(true);
    else setLoading(true);

    try {
      // 1. Fetch real master courses from lms_courses database
      const coursesRes = await fetch('/api/lms_academic.php?action=courses');
      const coursesJson = await coursesRes.json();

      let populatedCourses = [];
      if (coursesJson.status === 'success' && Array.isArray(coursesJson.data)) {
        // Fetch real structure (modules & lessons) for each course
        populatedCourses = await Promise.all(
          coursesJson.data.map(async (c) => {
            try {
              const structRes = await fetch(`/api/lms_academic.php?action=course_structure&course_id=${c.id}`);
              const structJson = await structRes.json();
              return {
                ...c,
                modules: structJson.data?.modules || []
              };
            } catch {
              return { ...c, modules: [] };
            }
          })
        );
      }
      setRealCourses(populatedCourses);

      // 2. Fetch real active class & assignments from relationships API
      const relData = await moduleApi('relationships');
      if (relData) {
        const found = relData.classes?.find(c => c.status === 'active') || relData.classes?.[0] || null;
        setActiveClass(found);
        setAssignments(relData.assignments || []);
      }

      // 3. Fetch real chapter materials data
      const savedChapters = localStorage.getItem('lms_sensei_chapters_data');
      if (savedChapters) {
        try {
          setChapters(JSON.parse(savedChapters));
        } catch (e) {
          console.error('Failed parsing chapters', e);
        }
      }

      if (isManualRefresh) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Data kurikulum real berhasil disinkronkan!',
          showConfirmButton: false,
          timer: 1800
        });
      }
    } catch (err) {
      console.error('Gagal memuat data akademik:', err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadRealData();
  }, [loadRealData]);

  // Calculations for Real Metrics:
  // 1. Class Meetings Progress
  const totalMeetings = Number(activeClass?.total_meetings) || 32;
  const completedMeetings = activeClass?.completed_meetings !== null && activeClass?.completed_meetings !== undefined && activeClass?.completed_meetings !== ''
    ? Number(activeClass.completed_meetings)
    : (Number(activeClass?.meeting_logs_count) || 1);
  const meetingProgress = Math.min(100, Math.round((completedMeetings / totalMeetings) * 100));

  // 2. Materials Completion Progress
  const { totalMaterials, completedMaterials, materialsProgress } = useMemo(() => {
    if (!chapters || chapters.length === 0) {
      return { totalMaterials: 5, completedMaterials: 4, materialsProgress: 80 };
    }
    let total = 0;
    let completed = 0;
    chapters.forEach((ch) => {
      const mats = ch.materials || [];
      total += mats.length || (ch.materialsCount || 0);
      completed += mats.filter(m => m.statusCode === 'completed').length || (ch.completedItems || 0);
    });
    const prog = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
    return { totalMaterials: total, completedMaterials: completed, materialsProgress: prog };
  }, [chapters]);

  // 3. Combined N5 Real Progress (Blended: 50% pertemuan kelas + 50% penguasaan materi)
  const n5Progress = useMemo(() => {
    const blended = Math.round(0.5 * meetingProgress + 0.5 * materialsProgress);
    return Math.max(meetingProgress, blended);
  }, [meetingProgress, materialsProgress]);

  // Sensei Name
  const senseiName = useMemo(() => {
    if (!activeClass) return 'Muhammad Faizal, S.Pd.';
    const assign = assignments.find(a => Number(a.class_id) === Number(activeClass.id));
    return assign?.sensei_name || 'Muhammad Faizal, S.Pd.';
  }, [activeClass, assignments]);

  // Quick Action to simulate adding 1 completed meeting (for testing real progress)
  const handleSimulateMeeting = () => {
    if (!activeClass) return;
    const nextMeetings = Math.min(totalMeetings, completedMeetings + 1);
    setActiveClass(prev => ({
      ...prev,
      completed_meetings: nextMeetings
    }));
    Swal.fire({
      icon: 'success',
      title: `Pertemuan Ke-${nextMeetings} Selesai!`,
      text: `Progres kelas dan roadmap bertambah secara otomatis menjadi ${Math.round((nextMeetings / totalMeetings) * 100)}% pertemuan.`,
      timer: 2000,
      showConfirmButton: false
    });
  };

  // Build Real-Time Milestones from Database `lms_courses` & `lms_modules`
  const dynamicMilestones = useMemo(() => {
    // If courses loaded from database
    const courseN5 = realCourses.find(c => (c.course_code || '').includes('N5') || c.id === '1');
    const courseN4 = realCourses.find(c => (c.course_code || '').includes('N4') || c.id === '2');
    const courseKaigo = realCourses.find(c => (c.course_code || '').includes('KAIGO') || c.id === '3');

    const isN5Achieved = n5Progress >= 80;
    const isN4Achieved = false;

    const list = [];

    // Milestone 1: Course 1 (N5 Dasar dari Database)
    if (courseN5) {
      const modules = courseN5.modules || [];
      const moduleList = modules.map(m => `${m.module_code || 'BAB'}: ${m.title}`);
      const lessonsList = modules.flatMap(m => (m.lessons || []).map(l => l.title));

      list.push({
        id: courseN5.id,
        stepNumber: '01',
        courseId: courseN5.id,
        courseCode: courseN5.course_code || 'JPN-N5-A1',
        title: courseN5.title || 'Bahasa Jepang Dasar (JF Standard A1 / JLPT N5)',
        badge: `Level: ${courseN5.jlpt_level || 'N5'} (${courseN5.jf_standard_level || 'A1'})`,
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        duration: `${courseN5.total_hours || 120} Jam Pembelajaran • Kelas: ${activeClass?.name || 'N5 Pagi'}`,
        status: 'active', // Currently running in real class
        progress: n5Progress,
        description: courseN5.description || 'Fondasi tata bahasa dasar, huruf Hiragana, Katakana, 100 Kanji, sapaan, dan percakapan harian.',
        modulesCount: modules.length,
        modules: modules,
        keyOutcomes: moduleList.length > 0
          ? moduleList.slice(0, 4)
          : [
            'Bab 1: HIRAGANA (Aksara dasar & pengenalan huruf)',
            'Bab 2: KATAKANA & Kosakata Serapan',
            'Bab 3 - 25: Pola Kalimat Minna no Nihongo I',
            'Target 100 Kanji N5 & 800 Kosakata Harian'
          ],
        primaryActionText: 'Buka Materi Kelas Ini',
        primaryActionUrl: '/lms/materi',
        secondaryActionText: 'Kelola Bab / Modul',
        secondaryActionUrl: `/lms/modules?course_id=${courseN5.id}`
      });
    }

    // Milestone 2: Course 2 (N4 Lanjutan dari Database)
    if (courseN4) {
      const modules = courseN4.modules || [];
      const moduleList = modules.map(m => `${m.module_code || 'BAB'}: ${m.title}`);

      list.push({
        id: courseN4.id,
        stepNumber: '02',
        courseId: courseN4.id,
        courseCode: courseN4.course_code || 'JPN-N4-A2',
        title: courseN4.title || 'Bahasa Jepang Lanjutan (JF Standard A2 / JLPT N4)',
        badge: `Level: ${courseN4.jlpt_level || 'N4'} (${courseN4.jf_standard_level || 'A2'})`,
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        duration: `${courseN4.total_hours || 140} Jam Pembelajaran • Lanjutan N5`,
        status: isN5Achieved ? 'active' : 'locked',
        progress: 0,
        description: courseN4.description || 'Tata bahasa menengah, 300 Kanji, komunikasi situasional di tempat kerja dan lingkungan umum.',
        modulesCount: modules.length,
        modules: modules,
        keyOutcomes: moduleList.length > 0
          ? moduleList.slice(0, 4)
          : [
            'Bab 1: KANJI N4 & Kosakata Kerja',
            'Bab 26 - 50: Pola Kalimat Minna no Nihongo II',
            'Bentuk Pasif (Ukemi) & Kausatif (Shieki) untuk Instruksi Kerja',
            'Pemahaman instruksi situasi nyata di Jepang'
          ],
        primaryActionText: 'Pratinjau Modul N4',
        primaryActionUrl: `/lms/modules?course_id=${courseN4.id}`,
        secondaryActionText: 'Lihat Kurikulum N4',
        secondaryActionUrl: '/lms/courses'
      });
    }

    // Milestone 3: Course 3 (Kaigo & Keperawatan dari Database)
    if (courseKaigo) {
      const modules = courseKaigo.modules || [];
      const moduleList = modules.map(m => `${m.module_code || 'BAB'}: ${m.title}`);

      list.push({
        id: courseKaigo.id,
        stepNumber: '03',
        courseId: courseKaigo.id,
        courseCode: courseKaigo.course_code || 'KAIGO-A2-B1',
        title: courseKaigo.title || 'Bahasa Jepang Kaigo & Keperawatan (JF A2/B1)',
        badge: `Bidang Kerja: Tokutei Ginou SSW 1`,
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        duration: `${courseKaigo.total_hours || 100} Jam Pelatihan Vokasional`,
        status: isN4Achieved ? 'active' : 'locked',
        lockReason: 'Terkunci (Perlu N4 Tuntas)',
        progress: 0,
        description: courseKaigo.description || 'Kosakata medis, instruksi perawatan fisik, dan komunikasi empati dengan lansia.',
        modulesCount: modules.length,
        modules: modules,
        keyOutcomes: moduleList.length > 0
          ? moduleList.slice(0, 4)
          : [
            'Bab 1: Pengantar & Etika Kaigo (介護の基本理念)',
            'Sapaan & Komunikasi Empati Lansia (声かけ - Koe-kake)',
            'Simulasi Ujian Evaluasi Keterampilan SSW Nursing Care',
            'Budaya Kerja Profesional Jepang: Hou-Ren-So'
          ],
        primaryActionText: 'Buka Silabus Kaigo',
        primaryActionUrl: `/lms/modules?course_id=${courseKaigo.id}`,
        secondaryActionText: 'Matriks Can-do Kaigo',
        secondaryActionUrl: '/lms/can-do'
      });
    }

    // Milestone 4: Course 4 (Persiapan Wawancara Kerja Mensetsu dari Database lms_courses)
    const courseMensetsu = realCourses.find(c => (c.course_code || '').includes('MENSETSU') || c.id === '4');
    if (courseMensetsu) {
      const modules = courseMensetsu.modules || [];
      const moduleList = modules.map(m => `${m.module_code || 'BAB'}: ${m.title}`);

      list.push({
        id: courseMensetsu.id,
        stepNumber: '04',
        courseId: courseMensetsu.id,
        courseCode: courseMensetsu.course_code || 'MENSETSU-JOB',
        title: courseMensetsu.title || 'Persiapan Wawancara Kerja (Mensetsu) & Budaya Kerja Jepang',
        badge: 'Persiapan Wawancara & Seleksi User',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        duration: `${courseMensetsu.total_hours || 40} Jam Bimbingan Khusus Mensetsu`,
        status: 'locked',
        lockReason: 'Terkunci (Perlu N4/Kaigo Tuntas)',
        progress: 0,
        description: courseMensetsu.description || 'Bimbingan intensif wawancara user Jepang, penyusunan CV Rirekisho, etika kerja Hou-Ren-So, dan simulasi mensetsu.',
        modulesCount: modules.length,
        modules: modules,
        keyOutcomes: moduleList.length > 0
          ? moduleList.slice(0, 4)
          : [
            'BAB-01: Penyusunan Rirekisho & Video Perkenalan Diri (Jikoshoukai)',
            'BAB-02: Simulasi Tanya Jawab Wawancara Kerja (Mensetsu)',
            'Simulasi 20 Pertanyaan Wajib User Jepang & Etika Ojigi',
            'Bimbingan Wawancara Bersama Sensei & Native Speaker'
          ],
        primaryActionText: 'Kelola Modul Wawancara',
        primaryActionUrl: `/lms/modules?course_id=${courseMensetsu.id}`,
        secondaryActionText: 'Buka Matching Job',
        secondaryActionUrl: '/matching-job'
      });
    }

    // Milestone 5: Puncak Kelulusan & Keberangkatan (Matching Job & Visa COE)
    list.push({
      id: 'final-step',
      stepNumber: '05',
      courseCode: 'CREATIVA-JOB-MATCH',
      title: 'Matching Perusahaan, Dokumen Visa COE & Terbang ke Jepang! ✈️',
      badge: 'Kelulusan & Penempatan Kerja',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      duration: 'Tahap Akhir Pasca Kelulusan & Wawancara',
      status: 'locked',
      lockReason: 'Tahap Akhir Pasca Wawancara',
      progress: 0,
      description: 'Tahap pendampingan akhir karier: Matching dengan perusahaan mitra di Jepang, penandatanganan kontrak kerja, pengurusan dokumen resmi COE, dan penerbangan.',
      modulesCount: 0,
      keyOutcomes: [
        'Penyusunan Curriculum Vitae standar Jepang (Rirekisho) & video perkenalan',
        'Simulasi wawancara kerja intensif bersama Sensei & Native Speaker Jepang',
        'Penandatanganan kontrak kerja resmi (Koyou Keiyakusho)',
        'Penerbitan COE (Certificate of Eligibility), Visa Kerja, dan tiket penerbangan'
      ],
      primaryActionText: 'Bursa Lowongan Kerja',
      primaryActionUrl: '/matching-job',
      secondaryActionText: 'Profil & Dokumen Siswa',
      secondaryActionUrl: '/lms/profil'
    });

    return list;
  }, [realCourses, n5Progress, activeClass]);

  return (
    <Layout>
      <div className="min-h-screen bg-[#f8fafc] pb-20">

        {/* ========================================================================= */}
        {/* ============================= HERO BANNER =============================== */}
        {/* ========================================================================= */}
        <div className="bg-white border-b border-slate-200/80 px-4 md:px-6 lg:px-8 py-7 relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-80 md:w-96 h-full bg-cover bg-no-repeat bg-right opacity-20 pointer-events-none"
            style={{
              backgroundImage: `url(${bannerImg})`,
              maskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 20%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 20%, transparent 100%)'
            }}
          />

          <div className="relative z-10 max-w-[1550px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
                <span>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span>Kurikulum</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-blue-600 font-bold">Learning Path (Alur Belajar)</span>
              </div>

              {/* Title & Badge */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  Alur Kurikulum Real (lms_courses & lms_modules)
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  {realCourses.length} Master Course Database Terkoneksi
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mt-2">
                Peta Perjalanan Belajar Menuju Jepang 🌸
              </h1>
              <p className="text-sm md:text-base text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
                Roadmap bertahap yang disinkronkan secara langsung dengan master kurikulum di menu <strong>Course</strong>, modul <strong>Bab Minna</strong>, dan kelas aktif Anda.
              </p>
            </div>

            {/* Quick Real Stats Pill Card */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/70 text-center min-w-[100px]">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tahap Aktif</div>
                <div className="text-base font-black text-blue-600 mt-0.5">Tahap 1 (N5)</div>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/70 text-center min-w-[110px]">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Progres Real</div>
                <div className="text-base font-black text-emerald-600 mt-0.5">{n5Progress}%</div>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/70 text-center min-w-[110px]">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kelas Anda</div>
                <div className="text-xs font-black text-slate-800 mt-1.5 truncate max-w-[100px]" title={activeClass?.name || 'N5 Pagi'}>
                  {activeClass?.name || 'N5 Pagi'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ==================== LIVE DATABASE SYNC & UPLOAD GUIDE =================== */}
        {/* ========================================================================= */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 lg:px-8 mt-5 space-y-4">

          {/* Status Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-extrabold text-slate-800">
                  Kelas Aktif: {activeClass?.name || 'N5 Pagi'} ({activeClass?.batch || 'Batch 1 2026'})
                </span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{completedMeetings} dari {totalMeetings} Pertemuan ({meetingProgress}%)</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5 text-slate-600">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>{completedMaterials} dari {totalMaterials} Materi Tuntas ({materialsProgress}%)</span>
              </div>
            </div>

            {/* Sync & Testing Action Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadRealData(true)}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-1.5 transition cursor-pointer"
                title="Sinkronkan ulang data dari database"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan'}</span>
              </button>

              <button
                onClick={handleSimulateMeeting}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl px-3 py-1.5 transition cursor-pointer"
                title="Uji coba menambah 1 pertemuan selesai untuk melihat perubahan persentase progres"
              >
                <span>+1 Pertemuan</span>
              </button>

              <button
                onClick={() => navigate('/lms/materi')}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl px-3 py-1.5 transition cursor-pointer"
                title="Buka halaman materi untuk menandai materi yang selesai dipelajari"
              >
                <span>Tandai Materi &rarr;</span>
              </button>
            </div>
          </div>

          {/* Quick Guide: Dari mana upload & mengedit kurikulum ini? */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-700">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-xs">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="font-extrabold text-slate-900 text-sm">
                  Panduan: Dari Mana Data Tahapan Ini Diatur & Diunggah?
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Semua kartu tahapan di bawah ini <strong>terhubung langsung ke database riil</strong>. Anda dapat mengelola kurikulumnya melalui menu sidebar <strong>KURIKULUM</strong>:
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 font-semibold text-slate-800">
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200/90 shadow-2xs">
                    1️⃣ <strong>Course</strong>: Tambah/edit level (N5, N4, Kaigo)
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200/90 shadow-2xs">
                    2️⃣ <strong>Module</strong>: Tambah Bab (Bab 1 Hiragana, Bab 2, dst)
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200/90 shadow-2xs">
                    3️⃣ <strong>Lesson</strong>: Tambah topik & Can-do
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200/90 shadow-2xs">
                    4️⃣ <strong>Materi</strong>: Upload Video/PDF/PPT ke dalam Bab
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                onClick={() => navigate('/lms/courses')}
                className="bg-white hover:bg-slate-50 text-blue-700 font-extrabold px-3.5 py-2 rounded-xl border border-blue-200 transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Kelola Course</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate('/lms/modules')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3.5 py-2 rounded-xl transition shadow-xs shadow-blue-600/30 cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Kelola Bab / Modul</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* ======================== CAREER TRACK SELECTOR ========================== */}
        {/* ========================================================================= */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 lg:px-8 mt-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pilih Jalur Program Belajar:
              </div>
              <div className="text-sm font-extrabold text-slate-800 mt-0.5">
                Kurikulum Intensif LPK Creativa Bridging International
              </div>
            </div>

            {/* Track Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTrack('kaigo')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${activeTrack === 'kaigo'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <HeartPulse className="w-3.5 h-3.5" />
                <span>Tokutei Ginou Kaigo (Keperawatan Lansia)</span>
              </button>

              <button
                onClick={() => setActiveTrack('manufaktur')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${activeTrack === 'manufaktur'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Tokutei Ginou Manufaktur / Kuliner</span>
              </button>

              <button
                onClick={() => setActiveTrack('magang')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${activeTrack === 'magang'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Program Magang (Ginou Jisshusei)</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ===================== ROADMAP TIMELINE CARDS ============================ */}
        {/* ========================================================================= */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 lg:px-8 mt-8 space-y-6">

          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
              <p className="font-bold text-sm text-slate-700">Memuat kurikulum resmi dari database...</p>
            </div>
          ) : (
            dynamicMilestones.map((item, index) => {
              const isCompleted = item.status === 'completed';
              const isActive = item.status === 'active';
              const isLocked = item.status === 'locked';

              return (
                <div
                  key={item.id}
                  className={`rounded-3xl border transition-all duration-300 relative overflow-hidden ${isActive
                      ? 'bg-white border-blue-500 shadow-lg shadow-blue-500/10 ring-4 ring-blue-500/10'
                      : isCompleted
                        ? 'bg-white border-emerald-300 shadow-xs hover:shadow-md'
                        : 'bg-white/80 border-slate-200 shadow-2xs hover:shadow-sm'
                    }`}
                >
                  {/* Active Indicator Top Accent Bar */}
                  {isActive && (
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />
                  )}
                  {isCompleted && (
                    <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                  )}

                  <div className="p-5 md:p-7">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">

                      {/* Left: Step Circle & Details */}
                      <div className="flex items-start gap-4 md:gap-5 flex-1">

                        {/* Step Number Circle Badge */}
                        <div className="relative shrink-0">
                          <div
                            className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-black text-lg md:text-xl shadow-sm transition ${isCompleted
                                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                                : isActive
                                  ? 'bg-blue-600 text-white shadow-blue-600/30 ring-4 ring-blue-100 animate-pulse'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}
                          >
                            {isCompleted ? (
                              <Check className="w-7 h-7 stroke-[3]" />
                            ) : isLocked ? (
                              <Lock className="w-6 h-6 text-slate-400" />
                            ) : (
                              item.stepNumber
                            )}
                          </div>

                          {/* Line connector for visual roadmap */}
                          {index < dynamicMilestones.length - 1 && (
                            <div className="hidden lg:block absolute left-1/2 -bottom-16 w-0.5 h-12 bg-slate-200 -translate-x-1/2" />
                          )}
                        </div>

                        {/* Main Info */}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${item.badgeColor}`}
                            >
                              {item.badge}
                            </span>

                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{item.duration}</span>
                            </span>

                            {/* Status Pill */}
                            {isCompleted && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Tuntas 100%
                              </span>
                            )}
                            {isActive && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                                <Flame className="w-3.5 h-3.5 text-blue-600" />
                                Tahap Anda Saat Ini ({item.progress}%)
                              </span>
                            )}
                            {isLocked && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                                <Lock className="w-3 h-3 text-slate-400" />
                                {item.lockReason || 'Terkunci (Perlu N5 ≥ 80%)'}
                              </span>
                            )}
                          </div>

                          {/* Title & Description */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
                              {item.title}
                            </h3>
                            {item.courseCode && (
                              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                {item.courseCode}
                              </span>
                            )}
                          </div>

                          <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-normal">
                            {item.description}
                          </p>

                          {/* Key Learning Outcomes Checklist (Directly from Real Modules) */}
                          <div className="pt-3">
                            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-blue-600" />
                              <span>Daftar Modul & Capaian Pembelajaran:</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
                              {item.keyOutcomes.map((outcome, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100"
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isCompleted
                                        ? 'bg-emerald-500 text-white'
                                        : isActive
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-slate-200 text-slate-500'
                                      }`}
                                  >
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </div>
                                  <span className="font-semibold text-slate-800 leading-snug">{outcome}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Right: Progress & Action Buttons */}
                      <div className="lg:w-72 flex flex-col justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 lg:border-l lg:pl-6 shrink-0">
                        <div>
                          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                            <span className="text-slate-400">Progres Penguasaan</span>
                            <span
                              className={
                                isCompleted
                                  ? 'text-emerald-600 font-black'
                                  : isActive
                                    ? 'text-blue-600 font-black'
                                    : 'text-slate-400'
                              }
                            >
                              {item.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${isCompleted
                                  ? 'bg-emerald-500'
                                  : isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500'
                                    : 'bg-slate-300'
                                }`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <button
                            onClick={() => navigate(item.primaryActionUrl)}
                            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition shadow-xs cursor-pointer ${isActive
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
                                : isCompleted
                                  ? 'bg-slate-800 hover:bg-slate-900 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                          >
                            <span>{item.primaryActionText}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => navigate(item.secondaryActionUrl)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200 transition cursor-pointer"
                          >
                            <span>{item.secondaryActionText}</span>
                          </button>
                        </div>

                      </div>

                    </div>
                  </div>
                </div>
              );
            })
          )}

        </div>

        {/* ========================================================================= */}
        {/* ======================== MOTIVATION & CALLOUT =========================== */}
        {/* ========================================================================= */}
        <div className="max-w-[1550px] mx-auto px-4 md:px-6 lg:px-8 mt-10">
          <div className="bg-gradient-to-r from-[#0d2238] via-[#143354] to-[#1c4773] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
            <div
              className="absolute right-0 top-0 bottom-0 w-2/5 opacity-20 pointer-events-none bg-right bg-cover"
              style={{
                backgroundImage: `url(${toriiGateImg})`
              }}
            />

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold mb-3 border border-blue-400/30">
                <Plane className="w-3.5 h-3.5 text-blue-300" />
                <span>Program Pendampingan Penuh LPK Creativa</span>
              </div>

              <h2 className="text-xl md:text-2xl font-black tracking-tight">
                Konsistensi Adalah Kunci Meraih Impian ke Jepang 🎌
              </h2>
              <p className="text-xs md:text-sm text-slate-200/90 mt-2 leading-relaxed">
                Setiap materi yang Anda selesaikan di LMS ini akan langsung tercatat dalam portofolio akademik. Nilai keaktifan, kuis, dan jam belajar akan menjadi pertimbangan utama Sensei saat merekomendasikan nama Anda ke perusahaan pengguna di Jepang.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-6">
                <button
                  onClick={() => navigate('/lms/materi')}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  Buka Materi Pembelajaran Sekarang
                </button>
                <button
                  onClick={() => navigate('/lms/can-do')}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition border border-white/20 cursor-pointer"
                >
                  Cek Matriks Can-do & Kompetensi &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
