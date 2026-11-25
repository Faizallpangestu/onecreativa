import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import {
  Calendar,
  Users,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
  School,
  Edit2,
  Trash2
} from "lucide-react";
import Swal from "sweetalert2";
import agendaHero from "../../assets/lms_agenda_hero_3d.jpg";

export default function LmsBatch() {
  const [batches, setBatches] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchRes, progRes] = await Promise.all([
        fetch("/api/lms_academic.php?action=batches"),
        fetch("/api/lms_academic.php?action=programs")
      ]);
      const batchData = await batchRes.json();
      const progData = await progRes.json();
      if (batchData.status === "success") setBatches(batchData.data || []);
      if (progData.status === "success") setPrograms(progData.data || []);
    } catch (err) {
      console.error("Error fetching batches:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = () => {
    Swal.fire({
      title: "Buka Batch / Angkatan Baru",
      html: `
        <div style="text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold;">Kode Batch</label>
          <input id="swal-batch-code" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Contoh: BATCH-2026-C" value="BATCH-2026-${String.fromCharCode(65 + batches.length)}" />
          
          <label style="font-weight: bold; margin-top: 6px;">Nama Angkatan</label>
          <input id="swal-batch-name" class="swal2-input" style="margin: 0; width: 100%;" placeholder="Contoh: Angkatan 2026-C Intensif" />
          
          <label style="font-weight: bold; margin-top: 6px;">Program Pelatihan</label>
          <select id="swal-batch-prog" class="swal2-input" style="margin: 0; width: 100%;">
            ${programs.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
          
          <div style="display:flex;gap:10px;margin-top:6px;">
            <div style="flex:1;">
              <label style="font-weight: bold; display: block; margin-bottom: 2px;">Tanggal Mulai</label>
              <input type="date" id="swal-batch-start" class="swal2-input" style="margin: 0; width: 100%;" value="${new Date().toISOString().split('T')[0]}" />
            </div>
            <div style="flex:1;">
              <label style="font-weight: bold; display: block; margin-bottom: 2px;">Tanggal Selesai</label>
              <input type="date" id="swal-batch-end" class="swal2-input" style="margin: 0; width: 100%;" value="${new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}" />
            </div>
          </div>

          <label style="font-weight: bold; margin-top: 6px;">Status Angkatan</label>
          <select id="swal-batch-status" class="swal2-input" style="margin: 0; width: 100%;">
            <option value="active">Sedang Berjalan (Active)</option>
            <option value="planned">Perencanaan (Pendaftaran Dibuka)</option>
            <option value="completed">Selesai / Lulus</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Buka Batch",
      cancelButtonText: "Batal",
      confirmButtonColor: "#059669",
      preConfirm: () => {
        const batch_code = document.getElementById("swal-batch-code").value.trim();
        const batch_name = document.getElementById("swal-batch-name").value.trim();
        const program_id = document.getElementById("swal-batch-prog").value;
        const start_date = document.getElementById("swal-batch-start").value;
        const end_date = document.getElementById("swal-batch-end").value;
        const status = document.getElementById("swal-batch-status").value;

        if (!batch_name) {
          Swal.showValidationMessage("Nama angkatan wajib diisi!");
          return false;
        }

        return { batch_code, batch_name, program_id, start_date, end_date, status };
      }
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=save_batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res.value)
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Berhasil", "Batch baru berhasil dibuka untuk pendaftaran siswa.", "success");
            fetchData();
          } else {
            Swal.fire("Gagal", json.message || "Gagal menyimpan batch", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const handleEditBatch = (batch) => {
    Swal.fire({
      title: "Edit Batch / Angkatan",
      html: `
        <div style="text-align: left; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
          <label style="font-weight: bold;">Kode Batch</label>
          <input id="swal-edit-batch-code" class="swal2-input" style="margin: 0; width: 100%;" value="${batch.batch_code || ''}" />
          
          <label style="font-weight: bold; margin-top: 6px;">Nama Angkatan</label>
          <input id="swal-edit-batch-name" class="swal2-input" style="margin: 0; width: 100%;" value="${batch.batch_name || ''}" />
          
          <label style="font-weight: bold; margin-top: 6px;">Program Pelatihan</label>
          <select id="swal-edit-batch-prog" class="swal2-input" style="margin: 0; width: 100%;">
            ${programs.map(p => `
              <option value="${p.id}" ${String(p.id) === String(batch.program_id) ? 'selected' : ''}>${p.name}</option>
            `).join('')}
          </select>
          
          <div style="display:flex;gap:10px;margin-top:6px;">
            <div style="flex:1;">
              <label style="font-weight: bold; display: block; margin-bottom: 2px;">Tanggal Mulai</label>
              <input type="date" id="swal-edit-batch-start" class="swal2-input" style="margin: 0; width: 100%;" value="${batch.start_date || ''}" />
            </div>
            <div style="flex:1;">
              <label style="font-weight: bold; display: block; margin-bottom: 2px;">Tanggal Selesai</label>
              <input type="date" id="swal-edit-batch-end" class="swal2-input" style="margin: 0; width: 100%;" value="${batch.end_date || ''}" />
            </div>
          </div>

          <label style="font-weight: bold; margin-top: 6px;">Status Angkatan</label>
          <select id="swal-edit-batch-status" class="swal2-input" style="margin: 0; width: 100%;">
            <option value="active" ${batch.status === 'active' ? 'selected' : ''}>Sedang Berjalan (Active)</option>
            <option value="planned" ${batch.status !== 'active' ? 'selected' : ''}>Perencanaan (Pendaftaran Dibuka)</option>
            <option value="completed" ${batch.status === 'completed' ? 'selected' : ''}>Selesai / Lulus</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Simpan Perubahan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#059669",
      preConfirm: () => {
        const batch_code = document.getElementById("swal-edit-batch-code").value.trim();
        const batch_name = document.getElementById("swal-edit-batch-name").value.trim();
        const program_id = document.getElementById("swal-edit-batch-prog").value;
        const start_date = document.getElementById("swal-edit-batch-start").value;
        const end_date = document.getElementById("swal-edit-batch-end").value;
        const status = document.getElementById("swal-edit-batch-status").value;

        if (!batch_name) {
          Swal.showValidationMessage("Nama angkatan wajib diisi!");
          return false;
        }

        return { id: batch.id, batch_code, batch_name, program_id, start_date, end_date, status };
      }
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=save_batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(res.value)
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Berhasil", "Data batch berhasil diperbarui.", "success");
            fetchData();
          } else {
            Swal.fire("Gagal", json.message || "Gagal menyimpan batch", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const handleDeleteBatch = (batch) => {
    Swal.fire({
      title: "Hapus Batch / Angkatan?",
      text: `Apakah Anda yakin ingin menghapus angkatan "${batch.batch_name}"? Data kelas dan enrollment yang terhubung akan terdampak.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626"
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const resp = await fetch("/api/lms_academic.php?action=delete_batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: batch.id })
          });
          const json = await resp.json();
          if (json.status === "success") {
            Swal.fire("Dihapus", "Batch berhasil dihapus dari sistem.", "success");
            fetchData();
          } else {
            Swal.fire("Gagal", json.message || "Gagal menghapus batch", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Gagal menghubungi server", "error");
        }
      }
    });
  };

  const filteredBatches = batches.filter(b => {
    const matchProg = selectedProgram === "ALL" || String(b.program_id) === String(selectedProgram);
    const matchSearch = b.batch_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.batch_code?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchProg && matchSearch;
  });

  const activeBatchesCount = batches.filter(b => b.status === "active").length;
  const planningBatchesCount = batches.filter(b => b.status !== "active").length;

  return (
    <Layout appearance={{}}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Banner Header */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0d2238] via-[#0f2e4d] to-[#143d63] shadow-md overflow-hidden text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 min-h-[160px]">
          {/* Photo on Right with Smooth Mask */}
          <div
            className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 opacity-40 md:opacity-90 pointer-events-none bg-right bg-cover"
            style={{
              backgroundImage: `url(${agendaHero})`,
              maskImage: 'linear-gradient(to right, transparent, black 30%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)'
            }}
          />

          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-300" />
              Tingkat 2 Hirarki LMS • Academic Cohort / Batch
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Manajemen Batch & Periode Angkatan
            </h1>
            <p className="text-xs md:text-sm text-slate-200/90 leading-relaxed font-normal">
              Kelola periode waktu angkatan belajar siswa, pembagian rombongan belajar (rombel), kuota penerimaan, dan jadwal wisuda/keberangkatan kerja ke Jepang.
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Angkatan</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{batches.length} Batch</div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Terdata di sistem</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sedang Berjalan</span>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{activeBatchesCount} Batch Aktif</div>
            <p className="text-[11px] text-emerald-600 mt-0.5 font-semibold">Proses pembelajaran</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Perencanaan</span>
            <div className="text-2xl font-black text-amber-600 mt-0.5">{planningBatchesCount} Batch Baru</div>
            <p className="text-[11px] text-amber-600 mt-0.5 font-semibold">Pendaftaran dibuka</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Durasi Rata-rata</span>
            <div className="text-2xl font-black text-indigo-600 mt-0.5">6 Bulan</div>
            <p className="text-[11px] text-indigo-600 mt-0.5 font-semibold">120-140 Jam Belajar</p>
          </div>
        </div>

        {/* Filter and Action Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau kode batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Program</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAddBatch}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buka Batch Baru</span>
          </button>
        </div>

        {/* Batches Table List */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Daftar Angkatan Terjadwal</h3>
            <span className="text-xs text-slate-500">Menampilkan {filteredBatches.length} Batch</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Kode Batch</th>
                  <th className="px-6 py-3.5">Nama Angkatan</th>
                  <th className="px-6 py-3.5">Program Pelatihan</th>
                  <th className="px-6 py-3.5">Periode Mulai & Selesai</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">Memuat data batch...</td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">Tidak ada batch yang sesuai pencarian.</td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                          {batch.batch_code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm">{batch.batch_name}</div>
                        <span className="text-[11px] text-slate-400">Rombel Bahasa Jepang Creativa</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {batch.program_name || "Program Bahasa Jepang Intensif"}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{batch.start_date || "10 Jan 2026"} s/d {batch.end_date || "30 Jun 2026"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${batch.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                          {batch.status === "active" ? "Sedang Berjalan" : "Perencanaan"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/lms/classes?batch_id=${batch.id}`}
                            className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-800 text-[11px] px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-all"
                            title="Buka Kelas / Rombel Angkatan"
                          >
                            <span>Kelas</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleEditBatch(batch)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-600 text-[11px] font-bold transition-all cursor-pointer"
                            title="Edit Batch"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteBatch(batch)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-bold transition-all cursor-pointer"
                            title="Hapus Batch"
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
