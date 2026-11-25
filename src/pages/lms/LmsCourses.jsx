import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams, Link } from "react-router-dom";
import Layout from "../../components/Layout";
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  Headphones,
  Book,
  PenTool,
  Mic,
  HelpCircle,
  FileCheck,
  Award,
  Sparkles,
  Layers,
  CheckCircle2,
  PlayCircle,
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  Clock,
  ArrowRight,
  Check
} from "lucide-react";
import Swal from "sweetalert2";
import fujiBanner from "../../assets/fuji_pagoda_banner.jpg";

export default function LmsCourses() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [structure, setStructure] = useState(null);
  const [openModuleIds, setOpenModuleIds] = useState({});
  const [selectedModuleFilter, setSelectedModuleFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Determine active view mode purely from URL pathname (Sidebar navigation)
  const activeMode = location.pathname.includes("modules")
    ? "modules"
    : location.pathname.includes("lessons")
      ? "lessons"
      : "courses";

  useEffect(() => {
    fetchCourses();
  }, []);

  // Sync selected course from query param or fallback to first course
  useEffect(() => {
    const courseIdParam = searchParams.get("course_id");
    if (courseIdParam) {
      setSelectedCourseId(parseInt(courseIdParam, 10));
    }
    const moduleIdParam = searchParams.get("module_id");
    if (moduleIdParam) {
      setSelectedModuleFilter(moduleIdParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchCourseStructure(selectedCourseId);
    }
  }, [selectedCourseId, activeMode]);

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/lms_academic.php?action=courses");
      const data = await res.json();
      if (data.status === "success" && data.data?.length > 0) {
        setCourses(data.data);
        const courseIdParam = searchParams.get("course_id");
        if (courseIdParam) {
          setSelectedCourseId(parseInt(courseIdParam, 10));
        } else {
          setSelectedCourseId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCourseStructure = async (courseId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/lms_academic.php?action=course_structure&course_id=${courseId}`);
      const data = await res.json();
      if (data.status === "success") {
        setStructure(data);
        // By default, expand all modules on modules or lessons view
        if (data.modules?.length > 0) {
          const allOpen = {};
          data.modules.forEach(m => { allOpen[m.id] = true; });
          setOpenModuleIds(allOpen);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = (courseId) => {
    const id = parseInt(courseId, 10);
    setSelectedCourseId(id);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("course_id", id);
    newParams.delete("module_id");
    setSelectedModuleFilter("all");
    setSearchParams(newParams, { replace: true });
  };

  const toggleModule = (id) => {
    setOpenModuleIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- COURSE CRUD ---
  const handleAddCourse = () => {
    Swal.fire({
      title: "Tambah Course / Kurikulum Baru",
      html: `
        <div style="text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold;">Kode Course</label>
          <input id="swal-crs-code" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Contoh: JPN-N4-A2" value="CRS-2026-${courses.length + 1}" />

          <label style="font-weight: bold; margin-top: 6px;">Judul Course</label>
          <input id="swal-crs-title" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Contoh: Bahasa Jepang Menengah (N4 / A2)" />

          <div style="display: flex; gap: 10px; margin-top: 6px;">
            <div style="flex: 1;">
              <label style="font-weight: bold; display: block; margin-bottom: 2px;">Level JF Standard</label>
              <select id="swal-crs-jf" class="swal2-input" style="margin: 0; width: 100%;">
                <option value="A1">A1 (Starter)</option>
                <option value="A2">A2 (Elementary)</option>
                <option value="B1">B1 (Intermediate)</option>
                <option value="B2">B2 (Upper Intermediate)</option>
              </select>
            </div>
            <div style="flex: 1;">
              <label style="font-weight: bold; display: block; margin-bottom: 2px;">Level JLPT</label>
              <select id="swal-crs-jlpt" class="swal2-input" style="margin: 0; width: 100%;">
                <option value="N5">JLPT N5</option>
                <option value="N4">JLPT N4</option>
                <option value="N3">JLPT N3</option>
                <option value="N2">JLPT N2</option>
              </select>
            </div>
          </div>

          <label style="font-weight: bold; margin-top: 6px;">Total Jam Pembelajaran</label>
          <input id="swal-crs-hours" type="number" class="swal2-input" style="margin: 0; width: 100%;" placeholder="120" value="120" />

          <label style="font-weight: bold; margin-top: 6px;">Deskripsi Course</label>
          <textarea id="swal-crs-desc" class="swal2-textarea" style="margin: 0; width: 100%; height: 70px;" placeholder="Deskripsi kurikulum dan sasaran kompetensi"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Simpan Course",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb",
      preConfirm: () => {
        const course_code = document.getElementById("swal-crs-code").value.trim();
        const title = document.getElementById("swal-crs-title").value.trim();
        const jf_standard_level = document.getElementById("swal-crs-jf").value;
        const jlpt_level = document.getElementById("swal-crs-jlpt").value;
        const total_hours = parseInt(document.getElementById("swal-crs-hours").value || "120", 10);
        const description = document.getElementById("swal-crs-desc").value.trim();

        if (!title) {
          Swal.showValidationMessage("Judul course wajib diisi!");
          return false;
        }

        return { course_code, title, jf_standard_level, jlpt_level, total_hours, description, status: "published" };
      }
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=save_course", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res.value)
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Berhasil", "Course baru berhasil ditambahkan.", "success");
            fetchCourses();
          } else {
            Swal.fire("Gagal", json.message || "Gagal menyimpan course", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const handleEditCourse = (course, e) => {
    if (e) e.stopPropagation();
    Swal.fire({
      title: "Edit Course / Kurikulum",
      html: `
        <div style="text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold;">Kode Course</label>
          <input id="swal-edit-crs-code" class="swal2-input" style="margin: 0; width: 100%;" value="${course.course_code || ''}" />

          <label style="font-weight: bold; margin-top: 6px;">Judul Course</label>
          <input id="swal-edit-crs-title" class="swal2-input" style="margin: 0; width: 100%;" value="${course.title || ''}" />

          <div style="display: flex; gap: 10px; margin-top: 6px;">
            <div style="flex: 1;">
              <label style="font-weight: bold; display: block; margin-bottom: 2px;">Level JF Standard</label>
              <select id="swal-edit-crs-jf" class="swal2-input" style="margin: 0; width: 100%;">
                <option value="A1" ${course.jf_standard_level === 'A1' ? 'selected' : ''}>A1 (Starter)</option>
                <option value="A2" ${course.jf_standard_level === 'A2' ? 'selected' : ''}>A2 (Elementary)</option>
                <option value="B1" ${course.jf_standard_level === 'B1' ? 'selected' : ''}>B1 (Intermediate)</option>
                <option value="B2" ${course.jf_standard_level === 'B2' ? 'selected' : ''}>B2 (Upper Intermediate)</option>
              </select>
            </div>
            <div style="flex: 1;">
              <label style="font-weight: bold; display: block; margin-bottom: 2px;">Level JLPT</label>
              <select id="swal-edit-crs-jlpt" class="swal2-input" style="margin: 0; width: 100%;">
                <option value="N5" ${course.jlpt_level === 'N5' ? 'selected' : ''}>JLPT N5</option>
                <option value="N4" ${course.jlpt_level === 'N4' ? 'selected' : ''}>JLPT N4</option>
                <option value="N3" ${course.jlpt_level === 'N3' ? 'selected' : ''}>JLPT N3</option>
                <option value="N2" ${course.jlpt_level === 'N2' ? 'selected' : ''}>JLPT N2</option>
              </select>
            </div>
          </div>

          <label style="font-weight: bold; margin-top: 6px;">Total Jam Pembelajaran</label>
          <input id="swal-edit-crs-hours" type="number" class="swal2-input" style="margin: 0; width: 100%;" value="${course.total_hours || 120}" />

          <label style="font-weight: bold; margin-top: 6px;">Deskripsi Course</label>
          <textarea id="swal-edit-crs-desc" class="swal2-textarea" style="margin: 0; width: 100%; height: 70px;">${course.description || ''}</textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Simpan Perubahan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb",
      preConfirm: () => {
        const course_code = document.getElementById("swal-edit-crs-code").value.trim();
        const title = document.getElementById("swal-edit-crs-title").value.trim();
        const jf_standard_level = document.getElementById("swal-edit-crs-jf").value;
        const jlpt_level = document.getElementById("swal-edit-crs-jlpt").value;
        const total_hours = parseInt(document.getElementById("swal-edit-crs-hours").value || "120", 10);
        const description = document.getElementById("swal-edit-crs-desc").value.trim();

        if (!title) {
          Swal.showValidationMessage("Judul course wajib diisi!");
          return false;
        }

        return { id: course.id, course_code, title, jf_standard_level, jlpt_level, total_hours, description, status: course.status || "published" };
      }
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=save_course", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res.value)
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Berhasil", "Course berhasil diperbarui.", "success");
            fetchCourses();
            if (parseInt(selectedCourseId) === parseInt(course.id)) {
              fetchCourseStructure(course.id);
            }
          } else {
            Swal.fire("Gagal", json.message || "Gagal menyimpan course", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const handleDeleteCourse = (course, e) => {
    if (e) e.stopPropagation();
    Swal.fire({
      title: "Hapus Course?",
      text: `Apakah Anda yakin ingin menghapus course "${course.title}"? Semua modul dan aktivitas di dalamnya akan terhapus.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus Course",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626"
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=delete_course", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: course.id })
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Dihapus", "Course berhasil dihapus.", "success");
            fetchCourses();
          } else {
            Swal.fire("Gagal", json.message || "Gagal menghapus course", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  // --- MODULE / BAB CRUD ---
  const handleAddModule = () => {
    Swal.fire({
      title: "Tambah Modul / Bab Baru",
      html: `
        <div style="text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold;">Course Tujuan</label>
          <div style="padding: 8px 12px; background: #f1f5f9; border-radius: 8px; font-weight: bold; color: #1e293b;">
            ${structure?.course?.title || "Course Aktif"}
          </div>

          <label style="font-weight: bold; margin-top: 6px;">Kode Bab</label>
          <input id="swal-mod-code" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Kode Bab (misal: BAB-06)" value="BAB-${String(structure?.modules?.length ? structure.modules.length + 1 : 1).padStart(2, '0')}" />

          <label style="font-weight: bold; margin-top: 6px;">Judul Bab</label>
          <input id="swal-mod-title" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Judul Bab (misal: Bab 6: Makanan & Minuman)" />

          <label style="font-weight: bold; margin-top: 6px;">Deskripsi Pembelajaran</label>
          <textarea id="swal-mod-desc" class="swal2-textarea" style="margin: 0; width: 100%; height: 70px;" placeholder="Deskripsi tata bahasa dan konteks pembelajaran"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Simpan Bab",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb",
      preConfirm: () => {
        const module_code = document.getElementById("swal-mod-code").value.trim();
        const title = document.getElementById("swal-mod-title").value.trim();
        const description = document.getElementById("swal-mod-desc").value.trim();

        if (!title) {
          Swal.showValidationMessage("Judul bab wajib diisi!");
          return false;
        }

        return {
          course_id: selectedCourseId,
          module_code,
          title,
          description,
          sort_order: (structure?.modules?.length || 0) + 1
        };
      }
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=save_module", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res.value)
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Berhasil", "Modul/Bab baru berhasil ditambahkan.", "success");
            fetchCourseStructure(selectedCourseId);
          } else {
            Swal.fire("Gagal", json.message || "Gagal menyimpan modul", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const handleEditModule = (mod, e) => {
    if (e) e.stopPropagation();
    Swal.fire({
      title: "Edit Modul / Bab",
      html: `
        <div style="text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold;">Kode Bab</label>
          <input id="swal-edit-mod-code" class="swal2-input" style="margin: 0; width: 100%;" value="${mod.module_code || ''}" />

          <label style="font-weight: bold; margin-top: 6px;">Judul Bab</label>
          <input id="swal-edit-mod-title" class="swal2-input" style="margin: 0; width: 100%;" value="${mod.title || ''}" />

          <label style="font-weight: bold; margin-top: 6px;">Deskripsi Pembelajaran</label>
          <textarea id="swal-edit-mod-desc" class="swal2-textarea" style="margin: 0; width: 100%; height: 70px;">${mod.description || ''}</textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Simpan Perubahan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb",
      preConfirm: () => {
        const module_code = document.getElementById("swal-edit-mod-code").value.trim();
        const title = document.getElementById("swal-edit-mod-title").value.trim();
        const description = document.getElementById("swal-edit-mod-desc").value.trim();

        if (!title) {
          Swal.showValidationMessage("Judul bab wajib diisi!");
          return false;
        }

        return {
          id: mod.id,
          course_id: selectedCourseId,
          module_code,
          title,
          description,
          sort_order: mod.sort_order || 1
        };
      }
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=save_module", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res.value)
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Berhasil", "Data modul berhasil diperbarui.", "success");
            fetchCourseStructure(selectedCourseId);
          } else {
            Swal.fire("Gagal", json.message || "Gagal menyimpan modul", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const handleDeleteModule = (mod, e) => {
    if (e) e.stopPropagation();
    Swal.fire({
      title: "Hapus Modul / Bab?",
      text: `Apakah Anda yakin ingin menghapus "${mod.title}" beserta seluruh lesson di dalamnya?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus Bab",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626"
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=delete_module", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: mod.id })
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Dihapus", "Modul berhasil dihapus.", "success");
            fetchCourseStructure(selectedCourseId);
          } else {
            Swal.fire("Gagal", json.message || "Gagal menghapus modul", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  // --- LESSON CRUD ---
  const handleAddLesson = (targetModuleId = null) => {
    const modulesList = structure?.modules || [];
    if (modulesList.length === 0) {
      Swal.fire("Peringatan", "Tambahkan Modul/Bab terlebih dahulu sebelum membuat Lesson.", "warning");
      return;
    }

    const defaultModId = targetModuleId || (selectedModuleFilter !== "all" ? selectedModuleFilter : modulesList[0].id);

    const moduleOptionsHtml = modulesList.map(m => `
      <option value="${m.id}" ${parseInt(m.id) === parseInt(defaultModId) ? 'selected' : ''}>
        ${m.module_code}: ${m.title}
      </option>
    `).join("");

    Swal.fire({
      title: "Tambah Topik / Lesson Baru",
      html: `
        <div style="text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold;">Pilih Modul / Bab</label>
          <select id="swal-les-mod" class="swal2-input" style="margin: 0; width: 100%;">
            ${moduleOptionsHtml}
          </select>

          <label style="font-weight: bold; margin-top: 6px;">Kode Lesson</label>
          <input id="swal-les-code" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Contoh: LES-01" value="LES-${Math.floor(10 + Math.random() * 90)}" />

          <label style="font-weight: bold; margin-top: 6px;">Judul Topik / Lesson</label>
          <input id="swal-les-title" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Contoh: Topik 1: Salam & Perkenalan Diri" />

          <label style="font-weight: bold; margin-top: 6px;">Target Can-do Statement (JF Standard)</label>
          <textarea id="swal-les-cando" class="swal2-textarea" style="margin: 0; width: 100%; height: 70px;" placeholder="Dapat memperkenalkan diri secara singkat dan menjawab pertanyaan sederhana."></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Simpan Lesson",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb",
      preConfirm: () => {
        const modId = document.getElementById("swal-les-mod").value;
        const lesson_code = document.getElementById("swal-les-code").value.trim();
        const title = document.getElementById("swal-les-title").value.trim();
        const can_do_statement = document.getElementById("swal-les-cando").value.trim();

        if (!title) {
          Swal.showValidationMessage("Judul lesson wajib diisi!");
          return false;
        }

        return {
          module_id: modId,
          lesson_code,
          title,
          can_do_statement,
          sort_order: 1
        };
      }
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=save_lesson", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res.value)
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Berhasil", "Lesson baru berhasil ditambahkan.", "success");
            fetchCourseStructure(selectedCourseId);
          } else {
            Swal.fire("Gagal", json.message || "Gagal menyimpan lesson", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const handleEditLesson = (lesson, moduleId) => {
    Swal.fire({
      title: "Edit Topik / Lesson",
      html: `
        <div style="text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold;">Kode Lesson</label>
          <input id="swal-edit-les-code" class="swal2-input" style="margin: 0; width: 100%;" value="${lesson.lesson_code || ''}" />

          <label style="font-weight: bold; margin-top: 6px;">Judul Topik / Lesson</label>
          <input id="swal-edit-les-title" class="swal2-input" style="margin: 0; width: 100%;" value="${lesson.title || ''}" />

          <label style="font-weight: bold; margin-top: 6px;">Target Can-do Statement (JF Standard)</label>
          <textarea id="swal-edit-les-cando" class="swal2-textarea" style="margin: 0; width: 100%; height: 70px;">${lesson.can_do_statement || ''}</textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Simpan Perubahan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb",
      preConfirm: () => {
        const lesson_code = document.getElementById("swal-edit-les-code").value.trim();
        const title = document.getElementById("swal-edit-les-title").value.trim();
        const can_do_statement = document.getElementById("swal-edit-les-cando").value.trim();

        if (!title) {
          Swal.showValidationMessage("Judul lesson wajib diisi!");
          return false;
        }

        return {
          id: lesson.id,
          module_id: moduleId,
          lesson_code,
          title,
          can_do_statement,
          sort_order: lesson.sort_order || 1
        };
      }
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=save_lesson", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res.value)
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Berhasil", "Lesson berhasil diperbarui.", "success");
            fetchCourseStructure(selectedCourseId);
          } else {
            Swal.fire("Gagal", json.message || "Gagal menyimpan lesson", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const handleDeleteLesson = (lesson) => {
    Swal.fire({
      title: "Hapus Topik / Lesson?",
      text: `Apakah Anda yakin ingin menghapus "${lesson.title}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626"
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=delete_lesson", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: lesson.id })
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Dihapus", "Lesson berhasil dihapus.", "success");
            fetchCourseStructure(selectedCourseId);
          } else {
            Swal.fire("Gagal", json.message || "Gagal menghapus lesson", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const getActivityBadge = (type) => {
    switch (type) {
      case "materi":
        return { label: "Materi", icon: FileText, color: "text-blue-600 bg-blue-50 border-blue-200" };
      case "listening":
        return { label: "Listening (Choukai)", icon: Headphones, color: "text-indigo-600 bg-indigo-50 border-indigo-200" };
      case "reading":
        return { label: "Reading (Dokkai)", icon: Book, color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
      case "writing":
        return { label: "Writing (Sakubun)", icon: PenTool, color: "text-amber-600 bg-amber-50 border-amber-200" };
      case "speaking":
        return { label: "Speaking (Hanashikata)", icon: Mic, color: "text-purple-600 bg-purple-50 border-purple-200" };
      case "kotoba":
        return { label: "Kotoba & Kanji", icon: Layers, color: "text-teal-600 bg-teal-50 border-teal-200" };
      case "kaiwa_ai":
        return { label: "Percakapan (Kaiwa)", icon: Mic, color: "text-indigo-600 bg-indigo-50 border-indigo-200 font-bold" };
      case "quiz":
        return { label: "Quiz Harian", icon: HelpCircle, color: "text-amber-700 bg-amber-50 border-amber-200" };
      case "tugas":
        return { label: "Tugas", icon: FileCheck, color: "text-cyan-700 bg-cyan-50 border-cyan-200" };
      default:
        return { label: "Aktivitas", icon: FileText, color: "text-slate-600 bg-slate-50 border-slate-200" };
    }
  };

  const getBannerInfo = () => {
    if (activeMode === "modules") {
      return {
        badge: "Tingkat 4 Hirarki LMS • Modules / Bab Pembelajaran",
        title: "Modul & Bab Pembelajaran (Minna no Nihongo / Kaigo)",
        desc: "Pengelompokan materi per Bab: Mengatur materi tata bahasa, kosakata tematik, dan target topik pembelajaran per unit buku."
      };
    }
    if (activeMode === "lessons") {
      return {
        badge: "Tingkat 5 Hirarki LMS • Lesson & Can-do Unit",
        title: "Lesson (Topik Pembelajaran & Can-do Unit)",
        desc: "Satuan unit ajar terkecil yang mengikat Target Can-do Statement JF Standard, tata bahasa inti, bank kosakata, dan 9 aktivitas pembelajaran."
      };
    }
    return {
      badge: "Tingkat 3 Hirarki LMS • Silabus & Kurikulum Induk",
      title: "Course & Silabus Utama",
      desc: "Kelola induk program pembelajaran (N5, N4, Kaigo), target jam belajar, level JF Standard / JLPT, dan alur kurikulum LPK Creativa."
    };
  };

  const banner = getBannerInfo();

  // Filter modules/lessons for lessons view
  const filteredModulesForLessons = (structure?.modules || []).filter(mod => {
    if (selectedModuleFilter === "all") return true;
    return parseInt(mod.id, 10) === parseInt(selectedModuleFilter, 10);
  });

  const totalLessonsInCourse = (structure?.modules || []).reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

  return (
    <Layout appearance={{}}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0d2238] via-[#0f2e4d] to-[#143d63] shadow-md overflow-hidden text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 min-h-[160px]">
          <div
            className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 opacity-40 md:opacity-90 pointer-events-none bg-right bg-cover"
            style={{
              backgroundImage: `url(${fujiBanner})`,
              maskImage: 'linear-gradient(to right, transparent, black 30%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)'
            }}
          />

          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-slate-200">
              <BookOpen className="w-3.5 h-3.5 text-slate-300" />
              {banner.badge}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {banner.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-200/90 leading-relaxed font-normal">
              {banner.desc}
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

        {/* ============================================================== */}
        {/* TAMPILAN 1: KHUSUS MENU COURSE (SIDEBAR: Course)               */}
        {/* ============================================================== */}
        {activeMode === "courses" && (
          <div className="space-y-6">
            {/* Header Kontrol Course */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Daftar Course & Silabus Utama
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tersedia {courses.length} Course aktif yang menjadi induk pembelajaran siswa intensif.
                </p>
              </div>
              <button
                onClick={handleAddCourse}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Course Baru</span>
              </button>
            </div>

            {/* Grid 3 Kartu Course */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {courses.map((c) => {
                const isSelected = parseInt(c.id, 10) === parseInt(selectedCourseId, 10);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCourse(c.id)}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer relative flex flex-col justify-between ${isSelected
                        ? "bg-blue-50/70 border-blue-400 shadow-md ring-2 ring-blue-500/20"
                        : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border font-mono ${isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                          {c.course_code}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          JF: {c.jf_standard_level} • JLPT {c.jlpt_level}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{c.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">{c.description}</p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-200/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {c.total_hours || 120} Jam Pembelajaran
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleEditCourse(c, e)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-600 transition cursor-pointer"
                            title="Edit Course"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteCourse(c, e)}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                            title="Hapus Course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Tombol navigasi langsung ke Bab */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/lms/modules?course_id=${c.id}`);
                        }}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${isSelected
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          }`}
                      >
                        <span>Buka Modul / Bab</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ringkasan Isi Silabus Course yang Terpilih */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                    Silabus Aktif Dipilih
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    {structure?.course?.title || "Memuat Silabus..."}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Total {structure?.modules?.length || 0} Bab dan {totalLessonsInCourse} Topik / Lesson terdaftar.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/lms/modules?course_id=${selectedCourseId}`)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition cursor-pointer"
                  >
                    <span>Kelola Bab di Modul (Bab Minna)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-8 text-center text-slate-400 text-sm">Memuat data silabus...</div>
              ) : (structure?.modules?.length || 0) === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm font-semibold text-slate-600">Belum ada Modul/Bab di Course ini</p>
                  <p className="text-xs text-slate-400 mt-1">Mulai tambahkan Bab pertama untuk menyusun kurikulum.</p>
                  <button
                    onClick={handleAddModule}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Bab Pertama</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {structure.modules.map((mod) => (
                    <div
                      key={mod.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 flex items-start justify-between gap-3 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                            {mod.module_code}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">{mod.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{mod.description}</p>
                        <span className="inline-block text-[11px] font-semibold text-slate-500 pt-1">
                          {mod.lessons?.length || 0} Topik / Lesson
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/lms/lessons?course_id=${selectedCourseId}&module_id=${mod.id}`)}
                        className="text-slate-400 hover:text-blue-600 transition p-1 cursor-pointer shrink-0"
                        title="Buka Lesson"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAMPILAN 2: KHUSUS MENU MODULE / BAB (SIDEBAR: Module)          */}
        {/* ============================================================== */}
        {activeMode === "modules" && (
          <div className="space-y-6">
            {/* Control Bar: Dropdown Pilih Course (Bersih, Rapi, Pengganti 3 Kartu Raksasa) */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Pilih Course:
                </span>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleSelectCourse(e.target.value)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[280px]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.course_code} — {c.title}
                    </option>
                  ))}
                </select>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {structure?.modules?.length || 0} Bab Terdaftar
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddModule}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Modul / Bab Baru</span>
                </button>
              </div>
            </div>

            {/* Daftar Modul / Bab */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Daftar Bab: {structure?.course?.title || "Memuat..."}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modul mengelompokkan materi per Bab buku standar (Minna no Nihongo / Kaigo).
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-sm">Memuat daftar bab...</div>
              ) : (structure?.modules?.length || 0) === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <FolderOpen className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Belum ada Bab untuk Course ini</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Course ini masih kosong. Silakan tambahkan Bab pertama untuk menyusun silabus materi.
                  </p>
                  <button
                    onClick={handleAddModule}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Bab Pertama</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {structure.modules.map((mod) => {
                    const isOpen = openModuleIds[mod.id];
                    return (
                      <div key={mod.id} className="border border-slate-200 rounded-2xl overflow-hidden transition-all">
                        {/* Header Bab */}
                        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/80 hover:bg-slate-100/70 transition-colors gap-3">
                          <button
                            type="button"
                            onClick={() => toggleModule(mod.id)}
                            className="flex items-center gap-3 text-left cursor-pointer flex-1"
                          >
                            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {mod.sort_order}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                                  {mod.module_code}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900">{mod.title}</h4>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                            </div>
                          </button>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <span className="text-xs font-semibold text-slate-500 px-2">
                              {mod.lessons?.length || 0} Lesson
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddLesson(mod.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition cursor-pointer"
                              title="Tambah Lesson ke Bab ini"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Lesson</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/lms/lessons?course_id=${selectedCourseId}&module_id=${mod.id}`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition cursor-pointer"
                              title="Lihat Rincian Lesson & Aktivitas"
                            >
                              <span>Buka Topik</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleEditModule(mod, e)}
                              className="p-1.5 rounded-lg bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                              title="Edit Bab"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteModule(mod, e)}
                              className="p-1.5 rounded-lg bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                              title="Hapus Bab"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleModule(mod.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Dropdown Rincian Lesson di dalam Bab */}
                        {isOpen && (
                          <div className="p-4 bg-white border-t border-slate-100 space-y-2">
                            {(!mod.lessons || mod.lessons.length === 0) ? (
                              <div className="text-xs text-slate-400 py-2 text-center">
                                Belum ada topik / lesson di dalam bab ini. Klik <strong>+ Lesson</strong> di atas untuk menambahkan.
                              </div>
                            ) : (
                              <div className="divide-y divide-slate-100">
                                {mod.lessons.map((les) => (
                                  <div key={les.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {les.lesson_code}
                                      </span>
                                      <span className="font-bold text-slate-800">{les.title}</span>
                                    </div>
                                    <span className="text-slate-500 italic truncate max-w-md hidden md:inline">
                                      {les.can_do_statement}
                                    </span>
                                    <span className="font-semibold text-slate-400 shrink-0">
                                      {les.activities?.length || 0} Aktivitas
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAMPILAN 3: KHUSUS MENU LESSON (SIDEBAR: Lesson)               */}
        {/* ============================================================== */}
        {activeMode === "lessons" && (
          <div className="space-y-6">
            {/* Control Bar: Filter Course & Bab (Bersih, Rapi, Pengganti 3 Kartu Raksasa) */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Course:</span>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => handleSelectCourse(e.target.value)}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[200px]"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.course_code} — {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Bab:</span>
                  <select
                    value={selectedModuleFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedModuleFilter(val);
                      const newParams = new URLSearchParams(searchParams);
                      if (val === "all") {
                        newParams.delete("module_id");
                      } else {
                        newParams.set("module_id", val);
                      }
                      setSearchParams(newParams, { replace: true });
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[200px]"
                  >
                    <option value="all">Semua Bab ({structure?.modules?.length || 0} Bab)</option>
                    {(structure?.modules || []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.module_code}: {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/lms/can-do"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Matriks Can-do JF Standard</span>
                </a>
                <button
                  onClick={() => handleAddLesson()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Lesson Baru</span>
                </button>
              </div>
            </div>

            {/* Daftar Lesson & Can-do Unit */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Daftar Lesson & Aktivitas Pembelajaran
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Menampilkan rincian topik kompetensi ajar Can-do dan 9 media aktivitas belajar per bab.
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-sm">Memuat daftar lesson...</div>
              ) : filteredModulesForLessons.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm font-semibold text-slate-600">Tidak ada Modul/Bab yang ditemukan</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredModulesForLessons.map((mod) => (
                    <div key={mod.id} className="space-y-4">
                      {/* Sub-header Bab */}
                      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                        <span className="font-mono text-xs font-bold text-white bg-blue-600 px-2.5 py-1 rounded-lg">
                          {mod.module_code}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900">{mod.title}</h4>
                        <span className="text-xs text-slate-400">({mod.lessons?.length || 0} Lesson)</span>
                      </div>

                      {/* List Lesson dalam Bab */}
                      {(!mod.lessons || mod.lessons.length === 0) ? (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-400 flex items-center justify-between">
                          <span>Belum ada topik/lesson terdaftar untuk bab ini.</span>
                          <button
                            onClick={() => handleAddLesson(mod.id)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            + Tambah Lesson
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {mod.lessons.map((les) => (
                            <div
                              key={les.id}
                              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50/80 transition-all space-y-3.5"
                            >
                              {/* Header Lesson & Can-do Statement */}
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-blue-100 text-blue-800 font-mono">
                                      {les.lesson_code}
                                    </span>
                                    <h5 className="text-sm font-extrabold text-slate-900">{les.title}</h5>
                                  </div>

                                  {/* Highlighted Can-do statement */}
                                  <div className="inline-flex items-start gap-2 text-xs text-indigo-800 bg-indigo-50/90 px-3.5 py-2 rounded-xl border border-indigo-100 max-w-3xl">
                                    <Award className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
                                    <span>
                                      <strong>Target Can-do Statement:</strong> {les.can_do_statement || "Belum ada target can-do yang ditetapkan."}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                                  <button
                                    onClick={() => handleEditLesson(les, mod.id)}
                                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition cursor-pointer"
                                    title="Edit Lesson"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLesson(les)}
                                    className="p-2 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition cursor-pointer"
                                    title="Hapus Lesson"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* 9 Grid Aktivitas Pembelajaran */}
                              <div className="pt-2 border-t border-slate-200/60">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                                  9 Aktivitas Pembelajaran Terintegrasi:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                  {les.activities && les.activities.length > 0 ? (
                                    les.activities.map((act) => {
                                      const badge = getActivityBadge(act.activity_type);
                                      const IconComponent = badge.icon;
                                      return (
                                        <div
                                          key={act.id}
                                          className="p-3 rounded-xl border border-slate-200/70 bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex items-start gap-2.5"
                                        >
                                          <div className={`p-2 rounded-lg border ${badge.color}`}>
                                            <IconComponent className="w-4 h-4" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                              {badge.label}
                                            </span>
                                            <h6 className="text-xs font-bold text-slate-800 truncate mt-0.5">
                                              {act.title}
                                            </h6>
                                          </div>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="col-span-full py-2 text-xs text-slate-400 italic">
                                      Aktivitas pembelajaran dapat diunggah melalui menu Materi Pembelajaran.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
