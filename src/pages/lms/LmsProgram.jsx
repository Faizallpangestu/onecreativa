import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import {
  GraduationCap,
  Plus,
  BookOpen,
  CheckCircle2,
  Award,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  Edit2,
  Trash2
} from "lucide-react";
import Swal from "sweetalert2";
import bannerStudents from "../../assets/banner_students_intensif.jpg";

export default function LmsProgram() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lms_academic.php?action=programs");
      const data = await res.json();
      if (data.status === "success") {
        setPrograms(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching programs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProgram = () => {
    Swal.fire({
      title: "Tambah Program Pelatihan Baru",
      html: `
        <div style="text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold;">Kode Program</label>
          <input id="swal-prog-code" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Contoh: TOKUTEI_GINOU" value="PROG-2026-${programs.length + 1}" />
          
          <label style="font-weight: bold; margin-top: 6px;">Nama Program Pelatihan</label>
          <input id="swal-prog-name" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Nama Program" />
          
          <label style="font-weight: bold; margin-top: 6px;">Target Level Kemahiran</label>
          <select id="swal-prog-level" class="swal2-input" style="margin: 0; width: 100%;">
            <option value="N5-N4">Level N5 - N4 (Dasar & Menengah)</option>
            <option value="N4-N3">Level N4 - N3 (Menengah ke Lanjutan)</option>
            <option value="N3-N2">Level N3 - N2 (Pra-Profesional)</option>
            <option value="A1-B1">JF Standard A1 - B1</option>
          </select>
          
          <label style="font-weight: bold; margin-top: 6px;">Deskripsi Program</label>
          <textarea id="swal-prog-desc" class="swal2-textarea" style="margin: 0; width: 100%; height: 75px;" placeholder="Deskripsi kurikulum dan sasaran penempatan kerja Jepang"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Simpan Program",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb",
      preConfirm: () => {
        const code = document.getElementById("swal-prog-code").value.trim();
        const name = document.getElementById("swal-prog-name").value.trim();
        const target_level = document.getElementById("swal-prog-level").value;
        const description = document.getElementById("swal-prog-desc").value.trim();

        if (!name) {
          Swal.showValidationMessage("Nama program wajib diisi!");
          return false;
        }

        return { code, name, target_level, description, status: "active" };
      }
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=save_program", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res.value)
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Berhasil", "Program baru berhasil didaftarkan.", "success");
            fetchPrograms();
          } else {
            Swal.fire("Gagal", json.message || "Gagal menyimpan", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const handleEditProgram = (prog) => {
    Swal.fire({
      title: "Edit Program Pelatihan",
      html: `
        <div style="text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold;">Kode Program</label>
          <input id="swal-edit-prog-code" class="swal2-input" style="margin: 0; width: 100%;" value="${prog.code || ''}" />
          
          <label style="font-weight: bold; margin-top: 6px;">Nama Program Pelatihan</label>
          <input id="swal-edit-prog-name" class="swal2-input" style="margin: 0; width: 100%;" value="${prog.name || ''}" />
          
          <label style="font-weight: bold; margin-top: 6px;">Target Level Kemahiran</label>
          <select id="swal-edit-prog-level" class="swal2-input" style="margin: 0; width: 100%;">
            <option value="N5-N4" ${prog.target_level === 'N5-N4' ? 'selected' : ''}>Level N5 - N4 (Dasar & Menengah)</option>
            <option value="N4-N3" ${prog.target_level === 'N4-N3' ? 'selected' : ''}>Level N4 - N3 (Menengah ke Lanjutan)</option>
            <option value="N3-N2" ${prog.target_level === 'N3-N2' ? 'selected' : ''}>Level N3 - N2 (Pra-Profesional)</option>
            <option value="A1-B1" ${prog.target_level === 'A1-B1' ? 'selected' : ''}>JF Standard A1 - B1</option>
          </select>
          
          <label style="font-weight: bold; margin-top: 6px;">Deskripsi Program</label>
          <textarea id="swal-edit-prog-desc" class="swal2-textarea" style="margin: 0; width: 100%; height: 75px;">${prog.description || ''}</textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Simpan Perubahan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb",
      preConfirm: () => {
        const code = document.getElementById("swal-edit-prog-code").value.trim();
        const name = document.getElementById("swal-edit-prog-name").value.trim();
        const target_level = document.getElementById("swal-edit-prog-level").value;
        const description = document.getElementById("swal-edit-prog-desc").value.trim();

        if (!name) {
          Swal.showValidationMessage("Nama program wajib diisi!");
          return false;
        }

        return { id: prog.id, code, name, target_level, description, status: prog.status || "active" };
      }
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=save_program", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res.value)
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Berhasil", "Data program berhasil diperbarui.", "success");
            fetchPrograms();
          } else {
            Swal.fire("Gagal", json.message || "Gagal menyimpan", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const handleDeleteProgram = (prog) => {
    Swal.fire({
      title: "Hapus Program Pelatihan?",
      text: `Apakah Anda yakin ingin menghapus program "${prog.name}"? Pastikan tidak ada batch yang terikat secara aktif.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus Program",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626"
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=delete_program", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: prog.id })
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Dihapus", "Program berhasil dihapus dari sistem.", "success");
            fetchPrograms();
          } else {
            Swal.fire("Gagal", json.message || "Gagal menghapus", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const filteredPrograms = programs.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout appearance={{}}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Banner Header */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0d2238] via-[#0f2e4d] to-[#143d63] shadow-md overflow-hidden text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 min-h-[160px]">
          {/* Photo on Right with Smooth Mask */}
          <div
            className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 opacity-40 md:opacity-90 pointer-events-none bg-right bg-cover"
            style={{
              backgroundImage: `url(${bannerStudents})`,
              maskImage: 'linear-gradient(to right, transparent, black 30%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)'
            }}
          />

          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-slate-200">
              <GraduationCap className="w-3.5 h-3.5 text-slate-300" />
              Tingkat 1 Hirarki LMS • Academic Program
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Manajemen Program Pelatihan
            </h1>
            <p className="text-xs md:text-sm text-slate-200/90 leading-relaxed font-normal">
              Kelola kategori dan rumpun program pendidikan bahasa Jepang LPK Creativa (Intensif Reguler SSW, Kaigo Careworker, Manufaktur, Tokutei Ginou) beserta target level kemahiran dan sasaran kerja.
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

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Program Aktif</span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{programs.length} Program</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Standar Kompetensi</span>
              <div className="text-2xl font-black text-emerald-600 mt-0.5">JF Standard</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Sertifikasi</span>
              <div className="text-2xl font-black text-indigo-600 mt-0.5">JLPT / JFT</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Action Header & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari program pelatihan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
          </div>
          <button
            onClick={handleAddProgram}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Program Pelatihan</span>
          </button>
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Memuat daftar program...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredPrograms.map((prog) => (
              <div
                key={prog.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                      {prog.code}
                    </span>
                    <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700">
                      Target: {prog.target_level || "N5-N4"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {prog.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {prog.description || "Program komprehensif pelatihan bahasa dan budaya kerja Jepang untuk persiapan kerja."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <a
                    href={`/lms/batch?program_id=${prog.id}`}
                    className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800"
                  >
                    Lihat Batch &rarr;
                  </a>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => handleEditProgram(prog)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[11px] font-bold transition-all"
                      title="Edit Program"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProgram(prog)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-bold transition-all"
                      title="Hapus Program"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
