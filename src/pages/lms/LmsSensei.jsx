import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import {
  Users,
  GraduationCap,
  Plus,
  Search,
  Award,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Mail,
  Phone,
  Star,
  Clock,
  School,
  Edit3,
  Edit2,
  Trash2,
  Filter,
  Globe2
} from "lucide-react";
import Swal from "sweetalert2";

export default function LmsSensei() {
  const [senseiList, setSenseiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterCert, setFilterCert] = useState("ALL");

  useEffect(() => {
    fetchSensei();
  }, []);

  const fetchSensei = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lms_academic.php?action=sensei_list");
      const json = await res.json();
      if (json.status === "success") {
        setSenseiList(json.data || []);
      }
    } catch (err) {
      console.error("Gagal memuat data sensei:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSensei = () => {
    Swal.fire({
      title: "Tambah Data Sensei Baru",
      html: `
        <div style="text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold; margin-bottom: 2px;">NIP / ID Sensei</label>
          <input id="swal-nip" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Contoh: SN-2026-005" value="SN-2026-00${senseiList.length + 1}" />
          
          <label style="font-weight: bold; margin-top: 6px; margin-bottom: 2px;">Nama Lengkap (Romaji)</label>
          <input id="swal-name-romaji" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Contoh: Honda Kenichi, M.Ed." />
          
          <label style="font-weight: bold; margin-top: 6px; margin-bottom: 2px;">Nama Kanji / Katakana (Opsional)</label>
          <input id="swal-name-kanji" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Contoh: 本田 健一" />
          
          <div style="display: flex; gap: 10px; margin-top: 6px;">
            <div style="flex: 1;">
              <label style="font-weight: bold; margin-bottom: 2px; display: block;">Tipe Pengajar</label>
              <select id="swal-teacher-type" class="swal2-input" style="margin: 0; width: 100%;">
                <option value="local">Sensei Lokal (WNI)</option>
                <option value="native">Native Speaker (Jepang)</option>
              </select>
            </div>
            <div style="flex: 1;">
              <label style="font-weight: bold; margin-bottom: 2px; display: block;">Sertifikasi</label>
              <select id="swal-jlpt-cert" class="swal2-input" style="margin: 0; width: 100%;">
                <option value="JLPT N1">JLPT N1</option>
                <option value="JLPT N2">JLPT N2</option>
                <option value="Native">Native Speaker</option>
                <option value="JF Standard">JF Standard Certified</option>
              </select>
            </div>
          </div>
          
          <label style="font-weight: bold; margin-top: 6px; margin-bottom: 2px;">Spesialisasi Kurikulum</label>
          <input id="swal-spec" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Contoh: Kaiwa, Tokutei Ginou SSW, Kaigo" />
          
          <label style="font-weight: bold; margin-top: 6px; margin-bottom: 2px;">Rombel / Kelas yang Diampu</label>
          <input id="swal-classes" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Contoh: Kelas Sakura A (N5)" />
          
          <div style="display: flex; gap: 10px; margin-top: 6px;">
            <div style="flex: 1;">
              <label style="font-weight: bold; margin-bottom: 2px; display: block;">Email Login LMS</label>
              <input type="email" id="swal-email" class="swal2-input" style="margin: 0; width: 100%;" placeholder="sensei@creativa.ac.id" />
            </div>
            <div style="flex: 1;">
              <label style="font-weight: bold; margin-bottom: 2px; display: block;">Nomor Telepon/WA</label>
              <input id="swal-phone" class="swal2-input" style="margin: 0; width: 100%;" placeholder="0812xxxx" />
            </div>
          </div>

          <label style="font-weight: bold; margin-top: 6px; margin-bottom: 2px;">Foto Profil Sensei</label>
          <div style="display: flex; align-items: center; gap: 12px; background: #f8fafc; padding: 10px; border-radius: 12px; border: 1px dashed #cbd5e1;">
            <img id="swal-preview-img" src="https://ui-avatars.com/api/?name=Sensei&background=0284c7&color=fff&bold=true" style="width: 50px; height: 50px; border-radius: 12px; object-fit: cover; border: 1px solid #e2e8f0;" />
            <div style="flex: 1;">
              <input type="file" id="swal-photo-file" accept="image/*" style="font-size: 11px; width: 100%; cursor: pointer;" />
              <input type="text" id="swal-photo-url" class="swal2-input" style="margin: 4px 0 0 0; width: 100%; height: 28px; font-size: 11px; padding: 4px 8px;" placeholder="Atau masukkan URL foto profil (opsional)..." />
            </div>
          </div>
        </div>
      `,
      didOpen: () => {
        const fileInput = document.getElementById("swal-photo-file");
        const previewImg = document.getElementById("swal-preview-img");
        const urlInput = document.getElementById("swal-photo-url");
        if (fileInput) {
          fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                if (previewImg) previewImg.src = event.target.result;
              };
              reader.readAsDataURL(file);
            }
          });
        }
        if (urlInput) {
          urlInput.addEventListener("input", (e) => {
            if (e.target.value.trim() && previewImg) {
              previewImg.src = e.target.value.trim();
            }
          });
        }
      },
      showCancelButton: true,
      confirmButtonText: "Simpan Sensei",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb",
      preConfirm: () => {
        const nip = document.getElementById("swal-nip").value.trim();
        const name_romaji = document.getElementById("swal-name-romaji").value.trim();
        const name_kanji = document.getElementById("swal-name-kanji").value.trim();
        const teacher_type = document.getElementById("swal-teacher-type").value;
        const jlpt_cert = document.getElementById("swal-jlpt-cert").value;
        const specialization = document.getElementById("swal-spec").value.trim();
        const assigned_classes = document.getElementById("swal-classes").value.trim();
        const email = document.getElementById("swal-email").value.trim();
        const phone = document.getElementById("swal-phone").value.trim();
        const photoUrl = document.getElementById("swal-photo-url")?.value.trim() || "";
        const previewImg = document.getElementById("swal-preview-img");
        const photo = (previewImg && previewImg.src && !previewImg.src.includes("ui-avatars.com")) ? previewImg.src : (photoUrl || null);

        if (!name_romaji || !email) {
          Swal.showValidationMessage("Nama Lengkap dan Email wajib diisi!");
          return false;
        }

        return {
          nip,
          name_romaji,
          name_kanji,
          teacher_type,
          jlpt_cert,
          specialization,
          assigned_classes,
          email,
          phone,
          photo,
          status: "active"
        };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch("/api/lms_academic.php?action=save_sensei", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result.value)
          });
          const json = await res.json();
          if (json.status === "success") {
            Swal.fire("Berhasil", "Data Sensei baru berhasil ditambahkan!", "success");
            fetchSensei();
          } else {
            Swal.fire("Gagal", json.message || "Terjadi kesalahan", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menyimpan data ke server", "error");
        }
      }
    });
  };

  const handleEditSensei = (sensei) => {
    const existingPhoto = sensei.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(sensei.name_romaji || 'Sensei')}&background=${sensei.teacher_type === 'native' ? 'dc2626' : '0284c7'}&color=fff&bold=true`;
    Swal.fire({
      title: "Edit Data Sensei",
      html: `
        <div style="text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold; margin-bottom: 2px;">NIP / ID Sensei</label>
          <input id="swal-edit-nip" class="swal2-input" style="margin: 0; width: 100%;" value="${sensei.nip || ''}" />
          
          <label style="font-weight: bold; margin-top: 6px; margin-bottom: 2px;">Nama Lengkap (Romaji)</label>
          <input id="swal-edit-name-romaji" class="swal2-input" style="margin: 0; width: 100%;" value="${sensei.name_romaji || ''}" />
          
          <label style="font-weight: bold; margin-top: 6px; margin-bottom: 2px;">Nama Kanji / Katakana (Opsional)</label>
          <input id="swal-edit-name-kanji" class="swal2-input" style="margin: 0; width: 100%;" value="${sensei.name_kanji || ''}" />
          
          <div style="display: flex; gap: 10px; margin-top: 6px;">
            <div style="flex: 1;">
              <label style="font-weight: bold; margin-bottom: 2px; display: block;">Tipe Pengajar</label>
              <select id="swal-edit-teacher-type" class="swal2-input" style="margin: 0; width: 100%;">
                <option value="local" ${sensei.teacher_type === 'local' ? 'selected' : ''}>Sensei Lokal (WNI)</option>
                <option value="native" ${sensei.teacher_type === 'native' ? 'selected' : ''}>Native Speaker (Jepang)</option>
              </select>
            </div>
            <div style="flex: 1;">
              <label style="font-weight: bold; margin-bottom: 2px; display: block;">Sertifikasi</label>
              <select id="swal-edit-jlpt-cert" class="swal2-input" style="margin: 0; width: 100%;">
                <option value="JLPT N1" ${sensei.jlpt_cert === 'JLPT N1' ? 'selected' : ''}>JLPT N1</option>
                <option value="JLPT N2" ${sensei.jlpt_cert === 'JLPT N2' ? 'selected' : ''}>JLPT N2</option>
                <option value="Native" ${sensei.jlpt_cert === 'Native' ? 'selected' : ''}>Native Speaker</option>
                <option value="JF Standard" ${sensei.jlpt_cert === 'JF Standard' ? 'selected' : ''}>JF Standard Certified</option>
              </select>
            </div>
          </div>
          
          <label style="font-weight: bold; margin-top: 6px; margin-bottom: 2px;">Spesialisasi Kurikulum</label>
          <input id="swal-edit-spec" class="swal2-input" style="margin: 0; width: 100%;" value="${sensei.specialization || ''}" />
          
          <label style="font-weight: bold; margin-top: 6px; margin-bottom: 2px;">Rombel / Kelas yang Diampu</label>
          <input id="swal-edit-classes" class="swal2-input" style="margin: 0; width: 100%;" value="${sensei.assigned_classes || ''}" />
          
          <div style="display: flex; gap: 10px; margin-top: 6px;">
            <div style="flex: 1;">
              <label style="font-weight: bold; margin-bottom: 2px; display: block;">Email Login LMS</label>
              <input type="email" id="swal-edit-email" class="swal2-input" style="margin: 0; width: 100%;" value="${sensei.email || ''}" />
            </div>
            <div style="flex: 1;">
              <label style="font-weight: bold; margin-bottom: 2px; display: block;">Nomor Telepon/WA</label>
              <input id="swal-edit-phone" class="swal2-input" style="margin: 0; width: 100%;" value="${sensei.phone || ''}" />
            </div>
          </div>

          <label style="font-weight: bold; margin-top: 6px; margin-bottom: 2px;">Foto Profil Sensei</label>
          <div style="display: flex; align-items: center; gap: 12px; background: #f8fafc; padding: 10px; border-radius: 12px; border: 1px dashed #cbd5e1;">
            <img id="swal-edit-preview-img" src="${existingPhoto}" style="width: 50px; height: 50px; border-radius: 12px; object-fit: cover; border: 1px solid #e2e8f0;" />
            <div style="flex: 1;">
              <input type="file" id="swal-edit-photo-file" accept="image/*" style="font-size: 11px; width: 100%; cursor: pointer;" />
              <input type="text" id="swal-edit-photo-url" class="swal2-input" style="margin: 4px 0 0 0; width: 100%; height: 28px; font-size: 11px; padding: 4px 8px;" placeholder="Atau tempel URL foto profil baru..." value="${sensei.photo && !sensei.photo.startsWith('data:') ? sensei.photo : ''}" />
            </div>
          </div>
        </div>
      `,
      didOpen: () => {
        const fileInput = document.getElementById("swal-edit-photo-file");
        const previewImg = document.getElementById("swal-edit-preview-img");
        const urlInput = document.getElementById("swal-edit-photo-url");
        if (fileInput) {
          fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                if (previewImg) previewImg.src = event.target.result;
              };
              reader.readAsDataURL(file);
            }
          });
        }
        if (urlInput) {
          urlInput.addEventListener("input", (e) => {
            if (e.target.value.trim() && previewImg) {
              previewImg.src = e.target.value.trim();
            }
          });
        }
      },
      showCancelButton: true,
      confirmButtonText: "Simpan Perubahan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb",
      preConfirm: () => {
        const nip = document.getElementById("swal-edit-nip").value.trim();
        const name_romaji = document.getElementById("swal-edit-name-romaji").value.trim();
        const name_kanji = document.getElementById("swal-edit-name-kanji").value.trim();
        const teacher_type = document.getElementById("swal-edit-teacher-type").value;
        const jlpt_cert = document.getElementById("swal-edit-jlpt-cert").value;
        const specialization = document.getElementById("swal-edit-spec").value.trim();
        const assigned_classes = document.getElementById("swal-edit-classes").value.trim();
        const email = document.getElementById("swal-edit-email").value.trim();
        const phone = document.getElementById("swal-edit-phone").value.trim();
        const photoUrl = document.getElementById("swal-edit-photo-url")?.value.trim() || "";
        const previewImg = document.getElementById("swal-edit-preview-img");
        let photo = sensei.photo || null;
        if (previewImg && previewImg.src && previewImg.src.startsWith("data:")) {
          photo = previewImg.src;
        } else if (photoUrl) {
          photo = photoUrl;
        }

        if (!name_romaji || !email) {
          Swal.showValidationMessage("Nama Lengkap dan Email wajib diisi!");
          return false;
        }

        return {
          id: sensei.id,
          nip,
          name_romaji,
          name_kanji,
          teacher_type,
          jlpt_cert,
          specialization,
          assigned_classes,
          email,
          phone,
          photo,
          status: sensei.status || "active"
        };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch("/api/lms_academic.php?action=save_sensei", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(result.value)
          });
          const json = await res.json();
          if (json.status === "success") {
            Swal.fire("Berhasil", "Data Sensei berhasil diperbarui!", "success");
            fetchSensei();
          } else {
            Swal.fire("Gagal", json.message || "Terjadi kesalahan", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menyimpan data ke server", "error");
        }
      }
    });
  };

  const handleDeleteSensei = (sensei) => {
    Swal.fire({
      title: "Hapus Data Sensei?",
      text: `Apakah Anda yakin ingin menghapus data "${sensei.name_romaji}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626"
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=delete_sensei", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: sensei.id })
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Dihapus", "Data Sensei berhasil dihapus.", "success");
            fetchSensei();
          } else {
            Swal.fire("Gagal", json.message || "Gagal menghapus data", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const filteredSensei = senseiList.filter((s) => {
    const matchSearch =
      s.name_romaji?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name_kanji?.includes(searchQuery) ||
      s.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nip?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchType = filterType === "ALL" || s.teacher_type === filterType;
    const matchCert = filterCert === "ALL" || s.jlpt_cert?.includes(filterCert);

    return matchSearch && matchType && matchCert;
  });

  const nativeCount = senseiList.filter((s) => s.teacher_type === "native").length;
  const localCount = senseiList.filter((s) => s.teacher_type === "local").length;
  const totalTeachingHours = senseiList.reduce((acc, s) => acc + (parseInt(s.total_teaching_hours, 10) || 0), 0);

  return (
    <Layout appearance={{}}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

        {/* BANNER HEADER */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0d2238] via-[#0f2e4d] to-[#143d63] shadow-md overflow-hidden text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 min-h-[160px]">
          {/* Photo on Right with Smooth Mask */}
          <div
            className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 opacity-40 md:opacity-90 pointer-events-none bg-right bg-cover"
            style={{
              backgroundImage: 'url(/sensei_teaching_3d.jpg)',
              maskImage: 'linear-gradient(to right, transparent, black 30%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)'
            }}
          />

          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-slate-200">
              <Users className="w-3.5 h-3.5 text-slate-300" />
              Tingkat Akademik • Master Data Pengajar Bahasa Jepang
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Data Sensei (Pengajar)
            </h1>
            <p className="text-xs md:text-sm text-slate-200/90 leading-relaxed font-normal">
              Kelola profil master sensei dan instruktur bahasa Jepang LPK Creativa (Native Speaker & Pengajar Lokal WNI), sertifikasi JLPT/JF Standard, rombongan belajar yang diampu, serta spesialisasi bidang kerja (Kaigo, SSW, Manufaktur).
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

        {/* QUICK STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Sensei</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{senseiList.length} Pengajar</div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Terdaftar resmi</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Native Speaker</span>
            <div className="text-2xl font-black text-rose-600 mt-0.5">{nativeCount} Sensei 🇯🇵</div>
            <p className="text-[11px] text-rose-600 mt-0.5 font-semibold">Penutur Asli Jepang</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pengajar Lokal</span>
            <div className="text-2xl font-black text-blue-600 mt-0.5">{localCount} Sensei 🇮🇩</div>
            <p className="text-[11px] text-blue-600 mt-0.5 font-semibold">Tersertifikasi N1 / N2</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rating Evaluasi</span>
            <div className="text-2xl font-black text-amber-600 mt-0.5">⭐ 4.9 / 5.0</div>
            <p className="text-[11px] text-amber-600 mt-0.5 font-semibold">Kepuasan siswa</p>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Jam KBM</span>
            <div className="text-2xl font-black text-indigo-600 mt-0.5">{totalTeachingHours || 945} Jam</div>
            <p className="text-[11px] text-indigo-600 mt-0.5 font-semibold">Akumulasi Jam Mengajar</p>
          </div>
        </div>

        {/* ACTION & FILTERS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, rombel, NIP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium shadow-2xs"
            >
              <option value="ALL">Semua Tipe Pengajar</option>
              <option value="local">Sensei Lokal (WNI 🇮🇩)</option>
              <option value="native">Native Speaker (Jepang 🇯🇵)</option>
            </select>

            <select
              value={filterCert}
              onChange={(e) => setFilterCert(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium shadow-2xs"
            >
              <option value="ALL">Semua Sertifikasi</option>
              <option value="Native">Native</option>
              <option value="N1">JLPT N1</option>
              <option value="N2">JLPT N2</option>
            </select>
          </div>

          <button
            onClick={handleAddSensei}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Tambah Data Sensei
          </button>
        </div>

        {/* SENSEI CARDS GRID */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Memuat data sensei...</div>
        ) : filteredSensei.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Tidak ada data sensei yang cocok.</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau filter tipe pengajar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSensei.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Header: Monospace NIP & Nationality / Certification Badges */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
                      {s.nip}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {s.teacher_type === "native" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          🇯🇵 Native Speaker
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          🇮🇩 Sensei Lokal
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {s.jlpt_cert}
                      </span>
                    </div>
                  </div>

                  {/* Sensei Identity with Photo & Specialization */}
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={s.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name_romaji || 'Sensei')}&background=${s.teacher_type === 'native' ? 'dc2626' : '0284c7'}&color=fff&bold=true`}
                      alt={s.name_romaji}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name_romaji || 'Sensei')}&background=0284c7&color=fff&bold=true`;
                      }}
                      className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-lg text-slate-900 leading-tight truncate" title={s.name_romaji}>
                        {s.name_romaji}
                      </h3>
                      {s.name_kanji && (
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          {s.name_kanji} 先生
                        </p>
                      )}
                      <p className="text-xs text-indigo-600 font-bold mt-1.5 line-clamp-1">
                        {s.specialization}
                      </p>
                    </div>
                  </div>

                  {/* Assigned Classes / Rombel Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 mb-4 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
                      <School className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Rombel / Kelas yang Diampu:</span>
                    </div>
                    <p className="text-slate-800 font-semibold pl-5">
                      {s.assigned_classes || "Belum ditugaskan rombel"}
                    </p>
                  </div>

                  {/* KBM Metric & Contacts Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 text-xs">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 text-slate-700 font-semibold">
                      <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{s.total_teaching_hours || 120} Jam Mengajar</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Aktif Mengajar</span>
                    </div>
                  </div>

                  {/* Contact Info (Dedicated Line) */}
                  <div className="flex flex-wrap items-center gap-4 py-2 px-3 rounded-xl bg-slate-50/60 border border-slate-100 text-xs text-slate-600 mb-4">
                    <span className="inline-flex items-center gap-1.5" title={s.email}>
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium truncate max-w-[180px]">{s.email}</span>
                    </span>
                    {s.phone && (
                      <span className="inline-flex items-center gap-1.5" title={s.phone}>
                        <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-medium">{s.phone}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Dedicated Action Footer */}
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Aksi Sensei
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => Swal.fire({
                        title: s.name_romaji,
                        html: `
                          <div style="text-align:left;font-size:13px;line-height:1.6;">
                            <p><strong>NIP:</strong> ${s.nip}</p>
                            <p><strong>Nama Kanji:</strong> ${s.name_kanji || '-'}</p>
                            <p><strong>Tipe:</strong> ${s.teacher_type === 'native' ? 'Native Speaker 🇯🇵' : 'Sensei Lokal 🇮🇩'}</p>
                            <p><strong>Sertifikasi:</strong> ${s.jlpt_cert}</p>
                            <p><strong>Spesialisasi:</strong> ${s.specialization}</p>
                            <p><strong>Rombel Diampu:</strong> ${s.assigned_classes || '-'}</p>
                            <p><strong>Email Login:</strong> ${s.email}</p>
                            <p><strong>WhatsApp:</strong> ${s.phone || '-'}</p>
                          </div>
                        `,
                        confirmButtonText: "Tutup",
                        confirmButtonColor: "#2563eb"
                      })}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => handleEditSensei(s)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/80 text-blue-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      title="Edit Sensei"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSensei(s)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/80 text-rose-600 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      title="Hapus Sensei"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
