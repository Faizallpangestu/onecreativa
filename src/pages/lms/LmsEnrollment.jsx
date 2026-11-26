import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import {
  UserCheck,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Layers,
  Award,
  Users,
  Edit2,
  Trash2
} from "lucide-react";
import Swal from "sweetalert2";

export default function LmsEnrollment() {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enrollRes, courseRes] = await Promise.all([
        fetch("/api/lms_academic.php?action=enrollments"),
        fetch("/api/lms_academic.php?action=courses")
      ]);
      const enrollData = await enrollRes.json();
      const courseData = await courseRes.json();
      if (enrollData.status === "success") setEnrollments(enrollData.data || []);
      if (courseData.status === "success") setCourses(courseData.data || []);
    } catch (err) {
      console.error("Gagal memuat data enrollment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollStudent = () => {
    Swal.fire({
      title: "Enroll Siswa ke Course",
      html: `
        <div style="text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold;">Pilih Siswa / Masukkan Nama / NIK</label>
          <input id="swal-enr-name" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Nama Lengkap Siswa" />
          
          <label style="font-weight: bold; margin-top: 6px;">Pilih Course Target</label>
          <select id="swal-enr-course" class="swal2-input" style="margin: 0; width: 100%;">
            ${courses.map(c => `<option value="${c.id}">${c.title} (${c.jf_standard_level}/${c.jlpt_level})</option>`).join('')}
          </select>
          
          <label style="font-weight: bold; margin-top: 6px;">Kelas / Rombel</label>
          <input id="swal-enr-class" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Contoh: Kelas Sakura A (Sensei Tanaka)" value="Kelas Sakura A (Sensei Tanaka)" />
          
          <label style="font-weight: bold; margin-top: 6px;">Status Awal</label>
          <select id="swal-enr-status" class="swal2-input" style="margin: 0; width: 100%;">
            <option value="active">Aktif Belajar</option>
            <option value="completed">Lulus / Selesai</option>
            <option value="suspended">Ditangguhkan / Cuti</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Enroll Sekarang",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb",
      preConfirm: () => {
        const student_name = document.getElementById("swal-enr-name").value.trim();
        const course_id = document.getElementById("swal-enr-course").value;
        const class_name = document.getElementById("swal-enr-class").value.trim();
        const status = document.getElementById("swal-enr-status").value;

        if (!student_name) {
          Swal.showValidationMessage("Nama Siswa wajib diisi!");
          return false;
        }

        return { student_name, course_id, class_name, status, progress_percent: 10 };
      }
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=save_enrollment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res.value)
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Berhasil", "Siswa berhasil didaftarkan (enrolled) ke course.", "success");
            fetchData();
          } else {
            Swal.fire("Gagal", json.message || "Terjadi kesalahan", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const handleEditEnrollment = (enr) => {
    Swal.fire({
      title: "Edit Enrollment Siswa",
      html: `
        <div style="text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
          <p style="margin: 0; color: #475569;"><strong>Siswa:</strong> ${enr.student_name} (${enr.student_email || '-'})</p>
          
          <label style="font-weight: bold; margin-top: 6px;">Course</label>
          <select id="swal-edit-course" class="swal2-input" style="margin: 0; width: 100%;">
            ${courses.map(c => `
              <option value="${c.id}" ${c.title === enr.course_title ? 'selected' : ''}>
                ${c.title} (${c.jf_standard_level}/${c.jlpt_level})
              </option>
            `).join('')}
          </select>

          <label style="font-weight: bold; margin-top: 6px;">Kelas / Rombel</label>
          <input id="swal-edit-class" class="swal2-input" style="margin: 0; width: 100%;" value="${enr.class_name || ''}" />

          <label style="font-weight: bold; margin-top: 6px;">Progres Modul (%)</label>
          <input type="number" id="swal-edit-progress" min="0" max="100" class="swal2-input" style="margin: 0; width: 100%;" value="${parseFloat(enr.progress_percent) || 0}" />

          <label style="font-weight: bold; margin-top: 6px;">Status Belajar</label>
          <select id="swal-edit-status" class="swal2-input" style="margin: 0; width: 100%;">
            <option value="active" ${enr.status === 'active' ? 'selected' : ''}>Aktif Belajar</option>
            <option value="completed" ${enr.status === 'completed' ? 'selected' : ''}>Lulus / Selesai</option>
            <option value="suspended" ${enr.status === 'suspended' ? 'selected' : ''}>Ditangguhkan</option>
            <option value="dropped" ${enr.status === 'dropped' ? 'selected' : ''}>Keluar (Dropped)</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Simpan Perubahan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb",
      preConfirm: () => {
        const course_id = document.getElementById("swal-edit-course").value;
        const class_name = document.getElementById("swal-edit-class").value.trim();
        const progress_percent = parseFloat(document.getElementById("swal-edit-progress").value) || 0;
        const status = document.getElementById("swal-edit-status").value;

        return {
          id: enr.enrollment_id,
          student_id: enr.student_id,
          course_id,
          class_name,
          progress_percent,
          status
        };
      }
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=save_enrollment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res.value)
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Berhasil", "Data enrollment berhasil diperbarui!", "success");
            fetchData();
          } else {
            Swal.fire("Gagal", json.message || "Gagal menyimpan", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const handleDeleteEnrollment = (enr) => {
    Swal.fire({
      title: "Unenroll Siswa?",
      text: `Hapus pendaftaran ${enr.student_name} dari course "${enr.course_title}"? Data progress belajar akan dilepas.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Unenroll Siswa",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626"
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=delete_enrollment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: enr.enrollment_id, student_id: enr.student_id })
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Dihapus", "Siswa berhasil di-unenroll dari course.", "success");
            fetchData();
          } else {
            Swal.fire("Gagal", json.message || "Gagal menghapus", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const filtered = enrollments.filter(e => {
    const matchCourse = selectedCourse === "ALL" || e.course_title?.toLowerCase().includes(selectedCourse.toLowerCase());
    const matchSearch = e.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.student_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.class_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCourse && matchSearch;
  });

  return (
    <Layout appearance={{}}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0d2238] via-[#0f2e4d] to-[#143d63] shadow-md overflow-hidden text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 min-h-[185px] md:min-h-[200px]">
          {/* Photo on Right with Smooth Mask */}
          <div
                        className="absolute right-0 top-0 bottom-0 w-full md:w-1/2 lg:w-2/5 opacity-50 md:opacity-95 pointer-events-none"
            style={{
              backgroundImage: 'url(/student_learning_3d.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'right top',
              maskImage: 'linear-gradient(to right, transparent, black 25%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 25%)'
            }}
          />

          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-slate-200">
              <UserCheck className="w-3.5 h-3.5 text-slate-300" />
              Moodle Benchmark • Course Enrollment Management
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Enrollment & Pendaftaran Siswa
            </h1>
            <p className="text-xs md:text-sm text-slate-200/90 leading-relaxed font-normal">
              Kelola penugasan siswa ke dalam Course, Kelas/Rombel, dan Batch aktif. Pantau status keikutsertaan dan progres aktivitas pembelajaran secara real-time.
            </p>
          </div>

          <div className="relative z-10 self-start md:self-center shrink-0 hidden sm:block">
            <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shadow-lg min-w-[130px]">
              <div className="text-[11px] font-medium text-slate-300">
                {new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date())}
              </div>
              <div className="text-sm font-extrabold text-white mt-0.5">
                {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{enrollments.length} Siswa</div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Terdaftar aktif</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Metode Enrollment</span>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">Cohort Sync</div>
            <p className="text-[11px] text-emerald-600 mt-0.5 font-semibold">Otomatis per Batch</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rata-rata Progres</span>
            <div className="text-2xl font-black text-indigo-600 mt-0.5">68.4%</div>
            <p className="text-[11px] text-indigo-600 mt-0.5 font-semibold">Aktivitas Modul</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kelulusan Course</span>
            <div className="text-2xl font-black text-amber-600 mt-0.5">84.5%</div>
            <p className="text-[11px] text-amber-600 mt-0.5 font-semibold">Target Capaian Can-do</p>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari siswa atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium shadow-2xs cursor-pointer"
            >
              <option value="ALL">Semua Course</option>
              {courses.map(c => (
                <option key={c.id} value={c.title}>{c.title}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleEnrollStudent}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll Siswa Baru</span>
          </button>
        </div>

        {/* Enrollments Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Daftar Siswa Terdaftar di Course</h3>
            <span className="text-xs text-slate-500 font-medium">Menampilkan {filtered.length} Siswa</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Nama Siswa</th>
                  <th className="px-6 py-3.5">Kelas / Rombel</th>
                  <th className="px-6 py-3.5">Course Terdaftar</th>
                  <th className="px-6 py-3.5 text-center">Level JF / JLPT</th>
                  <th className="px-6 py-3.5">Progres Modul</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">Memuat data enrollment...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">Belum ada siswa terdaftar pada kriteria ini.</td>
                  </tr>
                ) : (
                  filtered.map((enr, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm">{enr.student_name}</div>
                        <span className="text-[11px] text-slate-400">{enr.student_email || `ID Siswa: #${enr.student_id}`}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {enr.class_name}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {enr.course_title}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                          {enr.jf_standard_level || "A1"} / {enr.jlpt_level || "N5"}
                        </span>
                      </td>
                      <td className="px-6 py-4 w-44">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-600">
                            <span>Selesai</span>
                            <span>{parseFloat(enr.progress_percent) || 0}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-500"
                              style={{ width: `${parseFloat(enr.progress_percent) || 0}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${enr.status === 'completed' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          enr.status === 'suspended' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                          {enr.status === 'completed' ? 'Lulus Course' : enr.status === 'suspended' ? 'Ditangguhkan' : 'Aktif Belajar'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditEnrollment(enr)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-600 text-[11px] font-bold transition-all"
                            title="Edit data enrollment"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteEnrollment(enr)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-bold transition-all"
                            title="Hapus / Unenroll siswa"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
