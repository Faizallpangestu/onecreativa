import { useState, useMemo, useEffect } from 'react';
import Layout from '../components/Layout';
import bannerStudents from '../assets/banner_students_intensif.jpg';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import {
  getStoredStudents,
  addStoredStudent,
  updateStoredStudent,
  deleteStoredStudent,
  getAvatarFromEmail
} from '../services/lmsStudentData';
import {
  Users,
  Search,
  UserPlus,
  Eye,
  Edit2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Download,
  Filter,
  ArrowUpDown,
  Phone,
  Mail,
  MapPin,
  IdCard,
  BookOpen,
  X,
  Save,
  Trash2,
  Check
} from 'lucide-react';

export default function LpkIntensif() {
  const [students, setStudents] = useState(() => getStoredStudents());
  const [selectedIds, setSelectedIds] = useState([]);

  // Sinkronisasi otomatis saat ada penambahan/perubahan dari halaman lain
  useEffect(() => {
    const handleSync = () => {
      setStudents(getStoredStudents());
    };
    window.addEventListener('lms_data_sync', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('lms_data_sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Sorting State
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [currentStudent, setCurrentStudent] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form Input State
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    nik: '',
    program: 'Program Intensif',
    classRoom: 'N5',
    status: 'Aktif',
    joinDate: '22 Okt 2026',
    email: '',
    phone: '',
    gender: 'Laki-laki',
    birthDate: '',
    address: '',
    avatar: ''
  });

  // Calculate Stat Summary
  const stats = useMemo(() => {
    const activeCount = students.filter(s => s.status === 'Aktif').length;
    const inactiveCount = students.filter(s => s.status === 'Nonaktif').length;
    const graduatedCount = students.filter(s => s.status === 'Lulus Program').length;
    return {
      total: students.length,
      active: activeCount,
      inactive: inactiveCount,
      graduated: graduatedCount
    };
  }, [students]);

  // Filtering Logic
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch =
        searchQuery === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nik.includes(searchQuery) ||
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.classRoom.toLowerCase().includes(searchQuery.toLowerCase());

      const matchProgram = selectedProgram === 'ALL' || s.program === selectedProgram;
      const matchClass = selectedClass === 'ALL' || s.classRoom === selectedClass;
      const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;

      return matchSearch && matchProgram && matchClass && matchStatus;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [students, searchQuery, selectedProgram, selectedClass, selectedStatus, sortField, sortOrder]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  // Handle Sort Change
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Select all checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredStudents.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Select single row
  const handleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Open Create Student Modal
  const handleOpenCreate = () => {
    const nextNum = students.length + 1;
    const autoId = `S${String(nextNum).padStart(3, '0')}`;
    setFormData({
      name: '',
      studentId: autoId,
      nik: `3275012004${String(nextNum).padStart(6, '0')}`,
      program: 'Program Intensif',
      classRoom: 'N5',
      status: 'Aktif',
      joinDate: '22 Okt 2026',
      email: '',
      phone: '',
      gender: 'Laki-laki',
      birthDate: '2004-01-01',
      address: '',
      avatar: ''
    });
    setFormMode('create');
    setIsFormModalOpen(true);
  };

  // Open Edit Student Modal
  const handleOpenEdit = (student) => {
    setFormData({
      ...student
    });
    setCurrentStudent(student);
    setFormMode('edit');
    setIsFormModalOpen(true);
  };

  // Open Detail Student Modal
  const handleOpenDetail = (student) => {
    setCurrentStudent(student);
    setIsDetailModalOpen(true);
  };

  // Save Student (Create or Edit)
  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      Swal.fire('Nama Diperlukan', 'Silakan masukkan nama siswa.', 'warning');
      return;
    }
    if (!formData.nik.trim()) {
      Swal.fire('NIK Diperlukan', 'Silakan masukkan nomor induk kependudukan siswa.', 'warning');
      return;
    }

    const resolvedAvatar = getAvatarFromEmail(formData.email, formData.name);

    if (formMode === 'create') {
      const newEntry = addStoredStudent({
        ...formData,
        avatar: resolvedAvatar
      });
      setStudents(getStoredStudents());
      Swal.fire({
        icon: 'success',
        title: 'Siswa Berhasil Ditambahkan!',
        text: `${formData.name} telah terdaftar dalam sistem LMS dan terhubung ke Tugas, Quiz, Nilai & Leaderboard.`,
        timer: 1600,
        showConfirmButton: false
      });
    } else {
      updateStoredStudent(currentStudent.id, {
        ...formData,
        avatar: resolvedAvatar
      });
      setStudents(getStoredStudents());
      Swal.fire({
        icon: 'success',
        title: 'Data Siswa Diperbarui!',
        text: `Data ${formData.name} berhasil disimpan.`,
        timer: 1600,
        showConfirmButton: false
      });
    }
    setIsFormModalOpen(false);
  };

  // Delete Student
  const handleDeleteStudent = (student) => {
    Swal.fire({
      title: 'Hapus Siswa?',
      html: `Apakah Anda yakin ingin menghapus data siswa <b>${student.name}</b> (${student.studentId})?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus Data',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteStoredStudent(student.id);
        setStudents(getStoredStudents());
        setSelectedIds(prev => prev.filter(id => id !== student.id));
        Swal.fire('Terhapus!', `Siswa ${student.name} telah dihapus.`, 'success');
      }
    });
  };

  // Toggle Status Siswa
  const handleToggleStatus = (student) => {
    const nextStatus = student.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    updateStoredStudent(student.id, { status: nextStatus });
    setStudents(getStoredStudents());
    Swal.fire({
      icon: 'info',
      title: 'Status Diperbarui',
      html: `Status <b>${student.name}</b> diubah menjadi <b>${nextStatus}</b>.`,
      timer: 1400,
      showConfirmButton: false
    });
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredStudents.map((s, idx) => ({
      No: idx + 1,
      ID_Siswa: s.studentId,
      Nama_Lengkap: s.name,
      NIK: s.nik,
      Program: s.program,
      Kelas: s.classRoom,
      Status: s.status,
      Tanggal_Daftar: s.joinDate,
      Email: s.email || '-',
      No_WhatsApp: s.phone || '-',
      Kehadiran: s.attendanceRate || '0%',
      Rata_Nilai: s.gpa || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Siswa');
    XLSX.writeFile(workbook, `Data_Siswa_Peserta_Intensif_${new Date().toISOString().slice(0, 10)}.xlsx`);

    Swal.fire({
      icon: 'success',
      title: 'Berhasil Diekspor!',
      text: 'File Excel Data Siswa telah diunduh.',
      timer: 1600,
      showConfirmButton: false
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F4F6F9] pb-12 font-sans text-slate-800">
        <div className="max-w-[1700px] mx-auto p-3 sm:p-5 space-y-4">

          {/* ========================================================================= */}
          {/* 1. TOP HEADER BANNER (PERSIS GAMBAR)                                      */}
          {/* ========================================================================= */}
          <div className="relative rounded-3xl bg-gradient-to-r from-[#0d2238] via-[#0f2e4d] to-[#143d63] shadow-md overflow-hidden text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 min-h-[160px]">
            
            {/* Student Uniform Classroom Background Photo on the Right with Mask */}
            <div
              className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 opacity-40 md:opacity-90 pointer-events-none bg-right bg-cover"
              style={{
                backgroundImage: `url(${bannerStudents})`,
                maskImage: 'linear-gradient(to right, transparent, black 30%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)'
              }}
            />

            {/* Left Texts */}
            <div className="relative z-10 max-w-2xl space-y-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Data Siswa (Peserta Intensif)
              </h1>

              <p className="text-xs md:text-sm text-slate-200/90 leading-relaxed font-normal">
                Kelola dan lihat data peserta intensif yang terdaftar pada program LPK Creativa. Data ini digunakan untuk pemantauan pembelajaran, absensi, nilai, dan laporan.
              </p>
            </div>

            {/* Right Date Card (Persis Gambar: Kamis, 22 Okt 2026) */}
            <div className="relative z-10 self-start md:self-center shrink-0">
              <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shadow-lg min-w-[130px]">
                <div className="text-xs font-semibold text-slate-300">Kamis</div>
                <div className="text-sm font-extrabold text-white mt-0.5">22 Okt 2026</div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. SEARCH, FILTER & ACTION BAR (PERSIS GAMBAR)                             */}
          {/* ========================================================================= */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari nama siswa, NIK, atau kelas..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            {/* Dropdowns & Add Button */}
            <div className="flex items-center gap-2.5 flex-wrap">
              
              {/* Dropdown Program */}
              <div className="relative">
                <select
                  value={selectedProgram}
                  onChange={(e) => {
                    setSelectedProgram(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer hover:border-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">Program ▾</option>
                  <option value="ALL">Semua Program</option>
                  <option value="Program Intensif">Program Intensif</option>
                  <option value="Matching Job">Matching Job</option>
                </select>
              </div>

              {/* Dropdown Kelas */}
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer hover:border-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">Kelas ▾</option>
                  <option value="ALL">Semua Kelas</option>
                  <option value="N5">N5</option>
                  <option value="N4">N4</option>
                  <option value="N3">N3</option>
                  <option value="N2">N2</option>
                  <option value="N1">N1</option>
                </select>
              </div>

              {/* Dropdown Status */}
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer hover:border-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">Status ▾</option>
                  <option value="ALL">Semua Status</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                  <option value="Lulus Program">Lulus Program</option>
                </select>
              </div>

              {/* Download Excel Button */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3.5 py-2.5 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl shadow-2xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                title="Ekspor ke Excel"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Button Tambah Siswa */}
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-blue-500/25 transition cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <UserPlus className="w-4 h-4 stroke-[2.3]" />
                <span>Tambah Siswa</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. FOUR STAT SUMMARY CARDS (PERSIS GAMBAR)                                 */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            
            {/* Card 1: Total Siswa */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#EBF5FF] text-[#0284C7] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-400">Total Siswa</div>
                <div className="text-xl font-black text-slate-900 tracking-tight">{stats.total}</div>
              </div>
            </div>

            {/* Card 2: Siswa Aktif */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#EDFDF5] text-[#10B981] flex items-center justify-center shrink-0">
                <div className="w-4 h-4 rounded-full bg-[#10B981]" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-400">Siswa Aktif</div>
                <div className="text-xl font-black text-slate-900 tracking-tight">{stats.active}</div>
              </div>
            </div>

            {/* Card 3: Siswa Nonaktif */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#FFF1F2] text-[#F43F5E] flex items-center justify-center shrink-0">
                <div className="w-4 h-4 rounded-sm bg-[#F43F5E]" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-400">Siswa Nonaktif</div>
                <div className="text-xl font-black text-slate-900 tracking-tight">{stats.inactive}</div>
              </div>
            </div>

            {/* Card 4: Lulus Program */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#F5F3FF] text-[#8B5CF6] flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-400">Lulus Program</div>
                <div className="text-xl font-black text-slate-900 tracking-tight">{stats.graduated}</div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. DATA TABLE (PERSIS GAMBAR)                                             */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs min-w-[950px]">
                <thead className="bg-[#FAFBFD] text-slate-500 font-extrabold uppercase text-[11px] border-b border-slate-200/80 whitespace-nowrap">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
                        onChange={handleSelectAll}
                        className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5 w-12 text-center font-bold">No</th>
                    <th className="p-3.5 w-14 text-center font-bold">Foto</th>
                    <th className="p-3.5 cursor-pointer hover:text-slate-800" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1.5">
                        <span>Nama Siswa</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="p-3.5 cursor-pointer hover:text-slate-800" onClick={() => handleSort('nik')}>
                      <div className="flex items-center gap-1.5">
                        <span>NIK</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="p-3.5 cursor-pointer hover:text-slate-800" onClick={() => handleSort('program')}>
                      <div className="flex items-center gap-1.5">
                        <span>Program</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="p-3.5 cursor-pointer hover:text-slate-800" onClick={() => handleSort('classRoom')}>
                      <div className="flex items-center gap-1.5">
                        <span>Kelas</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="p-3.5 cursor-pointer hover:text-slate-800" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="p-3.5 cursor-pointer hover:text-slate-800" onClick={() => handleSort('joinDate')}>
                      <div className="flex items-center gap-1.5">
                        <span>Tanggal Daftar</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="p-3.5 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="py-16 px-4 text-center">
                        <div className="max-w-sm mx-auto flex flex-col items-center">
                          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-inner">
                            <Users className="w-8 h-8" />
                          </div>
                          <h3 className="text-sm font-extrabold text-slate-800">
                            {students.length === 0 ? 'Belum Ada Data Siswa' : 'Tidak Ditemukan Siswa'}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
                            {students.length === 0
                              ? 'Data siswa peserta intensif saat ini masih kosong. Klik tombol di bawah untuk menambahkan siswa baru.'
                              : 'Tidak ada data siswa yang cocok dengan filter atau kata kunci pencarian.'}
                          </p>
                          {students.length === 0 && (
                            <button
                              type="button"
                              onClick={handleOpenCreate}
                              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-2 active:scale-95"
                            >
                              <UserPlus className="w-4 h-4" />
                              <span>Tambah Siswa Baru</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s, idx) => {
                      const isChecked = selectedIds.includes(s.id);
                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-slate-50/80 transition ${
                            isChecked ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSelectRow(s.id)}
                              className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                            />
                          </td>

                          {/* No */}
                          <td className="p-3.5 text-center font-bold text-slate-400">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </td>

                          {/* Foto */}
                          <td className="p-3.5 text-center">
                            <img
                              src={s.avatar || getAvatarFromEmail(s.email, s.name)}
                              alt={s.name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || 'S')}&background=0284c7&color=fff&bold=true`;
                              }}
                              className="w-8 h-8 rounded-full object-cover mx-auto border border-slate-200 shadow-2xs"
                            />
                          </td>

                          {/* Nama Siswa & ID Siswa */}
                          <td className="p-3.5">
                            <div className="font-extrabold text-slate-900">{s.name}</div>
                            <div className="text-[11px] text-slate-400 font-medium">{s.studentId}</div>
                          </td>

                          {/* NIK */}
                          <td className="p-3.5 font-mono text-slate-600 font-medium">
                            {s.nik}
                          </td>

                          {/* Program Pill */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#EBF5FF] text-[#2563EB]">
                              {s.program}
                            </span>
                          </td>

                          {/* Kelas Pill */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#EBF5FF] text-[#2563EB]">
                              {s.classRoom}
                            </span>
                          </td>

                          {/* Status Pill (Persis Gambar: Dot Hijau Aktif / Dot Merah Nonaktif) */}
                          <td className="p-3.5 whitespace-nowrap">
                            {s.status === 'Aktif' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#EDFDF5] text-[#10B981]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                <span>Aktif</span>
                              </span>
                            ) : s.status === 'Nonaktif' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FFF1F2] text-[#F43F5E]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E]" />
                                <span>Nonaktif</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#F5F3FF] text-[#8B5CF6]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                                <span>{s.status}</span>
                              </span>
                            )}
                          </td>

                          {/* Tanggal Daftar */}
                          <td className="p-3.5 whitespace-nowrap text-slate-600 font-medium">
                            {s.joinDate}
                          </td>

                          {/* Action Buttons: View, Edit, More */}
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1 text-slate-500">
                              
                              {/* Eye / View */}
                              <button
                                type="button"
                                onClick={() => handleOpenDetail(s)}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition cursor-pointer"
                                title="Lihat Profil Siswa"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit / Pencil */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(s)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition cursor-pointer"
                                title="Edit Data Siswa"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* More Vertical Options */}
                              <button
                                type="button"
                                onClick={() => {
                                  Swal.fire({
                                    title: s.name,
                                    html: `
                                      <div class="text-xs text-left space-y-2 p-1">
                                        <p><b>ID Siswa:</b> ${s.studentId}</p>
                                        <p><b>NIK:</b> ${s.nik}</p>
                                        <p><b>Kelas:</b> ${s.classRoom} (${s.program})</p>
                                        <p><b>Kontak:</b> ${s.phone || '-'} / ${s.email || '-'}</p>
                                      </div>
                                    `,
                                    showDenyButton: true,
                                    showCancelButton: true,
                                    confirmButtonText: s.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan',
                                    confirmButtonColor: s.status === 'Aktif' ? '#f59e0b' : '#10b981',
                                    denyButtonText: 'Hapus Siswa',
                                    denyButtonColor: '#ef4444',
                                    cancelButtonText: 'Tutup'
                                  }).then((res) => {
                                    if (res.isConfirmed) {
                                      handleToggleStatus(s);
                                    } else if (res.isDenied) {
                                      handleDeleteStudent(s);
                                    }
                                  });
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                title="Opsi Lainnya"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ========================================================================= */}
            {/* 5. BOTTOM PAGINATION BAR (PERSIS GAMBAR)                                   */}
            {/* ========================================================================= */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 gap-3 text-xs text-slate-500 font-medium">
              <div>
                Menampilkan {filteredStudents.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                {Math.min(currentPage * itemsPerPage, filteredStudents.length)} dari {filteredStudents.length} siswa
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Prev */}
                <button
                  type="button"
                  disabled={currentPage === 1 || totalPages <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center transition cursor-pointer ${
                      currentPage === pageNum ? 'bg-blue-600 text-white shadow-xs' : 'border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                {/* Next */}
                <button
                  type="button"
                  disabled={currentPage === totalPages || totalPages <= 1}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {/* Items per page */}
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="ml-2 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer focus:outline-none"
                >
                  <option value={10}>10 / halaman ▾</option>
                  <option value={20}>20 / halaman ▾</option>
                  <option value={50}>50 / halaman ▾</option>
                </select>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL FORM: TAMBAH / EDIT SISWA                                        */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {formMode === 'create' ? 'Tambah Data Siswa Baru' : 'Edit Data Siswa'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Lengkapi identitas siswa peserta intensif LPK Creativa
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveStudent} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Nama Lengkap */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lengkap Siswa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: Rina Aulia"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                {/* ID Siswa */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ID Siswa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                    placeholder="Contoh: S001"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 font-mono"
                  />
                </div>

                {/* NIK */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NIK (Nomor Induk Kependudukan) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nik}
                    onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value }))}
                    placeholder="Contoh: 3275012004010001"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 font-mono"
                  />
                </div>

                {/* Program */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Program Pelatihan
                  </label>
                  <select
                    value={formData.program}
                    onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 font-medium cursor-pointer"
                  >
                    <option value="Program Intensif">Program Intensif</option>
                    <option value="Matching Job">Matching Job</option>
                  </select>
                </div>

                {/* Kelas */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kelas Belajar
                  </label>
                  <select
                    value={formData.classRoom}
                    onChange={(e) => setFormData(prev => ({ ...prev, classRoom: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 font-medium cursor-pointer"
                  >
                    <option value="N5">N5</option>
                    <option value="N4">N4</option>
                    <option value="N3">N3</option>
                    <option value="N2">N2</option>
                    <option value="N1">N1</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status Siswa
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 font-medium cursor-pointer"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                    <option value="Lulus Program">Lulus Program</option>
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Siswa <span className="text-slate-400 font-normal text-[10px]">(Foto diambil otomatis dari email)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Contoh: siswa@gmail.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 font-medium"
                  />
                  {/* Live Avatar Preview from Email */}
                  <div className="flex items-center gap-2.5 mt-2 p-2 bg-slate-50/80 rounded-xl border border-slate-200/80">
                    <img
                      src={getAvatarFromEmail(formData.email, formData.name)}
                      alt="Preview Foto Siswa"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'S')}&background=0284c7&color=fff&bold=true`;
                      }}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                    />
                    <span className="text-[10px] text-slate-500 leading-tight">
                      {formData.email
                        ? 'Foto profil otomatis tersinkron dari akun email siswa.'
                        : 'Foto profil otomatis di-generate berdasarkan alamat email siswa.'}
                    </span>
                  </div>
                </div>

                {/* No WhatsApp */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Contoh: +62 812-3456-7890"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Tanggal Daftar */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Terdaftar
                  </label>
                  <input
                    type="text"
                    value={formData.joinDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, joinDate: e.target.value }))}
                    placeholder="10 Okt 2026"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 font-medium cursor-pointer"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Masukkan alamat domisili siswa..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 font-medium"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{formMode === 'create' ? 'Simpan Siswa' : 'Perbarui Data'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL DETAIL SISWA (VIEW)                                              */}
      {/* ========================================================================= */}
      {isDetailModalOpen && currentStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            
            {/* Header Banner Modal */}
            <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-white relative">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <img
                  src={currentStudent.avatar || getAvatarFromEmail(currentStudent.email, currentStudent.name)}
                  alt={currentStudent.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentStudent.name || 'S')}&background=0284c7&color=fff&bold=true`;
                  }}
                  className="w-16 h-16 rounded-full border-2 border-white object-cover shadow-md"
                />
                <div>
                  <h3 className="font-extrabold text-lg">{currentStudent.name}</h3>
                  <div className="text-xs text-blue-200 font-mono mt-0.5">{currentStudent.studentId} • NIK: {currentStudent.nik}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                      {currentStudent.classRoom}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                      ● {currentStudent.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info Details */}
            <div className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Tingkat Kehadiran</div>
                  <div className="text-sm font-extrabold text-slate-800">{currentStudent.attendanceRate || '96%'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Rata-rata Nilai</div>
                  <div className="text-sm font-extrabold text-blue-600">{currentStudent.gpa || '88.0'} / 100</div>
                </div>
              </div>

              <div className="space-y-2 text-slate-600">
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                  <span><b>Program:</b> {currentStudent.program}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span><b>Email:</b> {currentStudent.email || '-'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span><b>WhatsApp:</b> {currentStudent.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span><b>Tanggal Terdaftar:</b> {currentStudent.joinDate}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span><b>Alamat:</b> {currentStudent.address || 'Bandung, Jawa Barat'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEdit(currentStudent);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition cursor-pointer"
                >
                  Edit Data
                </button>
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </Layout>
  );
}
