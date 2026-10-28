import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { 
  FinancePageHeader, 
  FinanceKpiCard, 
  FinanceFilterBar, 
  FinanceTable, 
  FinanceBadge, 
  exportToExcel 
} from "./FinancePageComponents";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Eye, 
  Edit2, 
  Trash2, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  X, 
  Save, 
  Hash, 
  Award,
  Globe
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";

const INITIAL_STUDENTS = [
  { id: 1, nama: "Andi Saputra", nis: "S-001", program: "Program Pelatihan Jepang", batch: "Batch 2", kontak: "0812-3456-1122", email: "andi.saputra@gmail.com", affiliator: "Yayasan Bina Insan", alamat: "Jl. Raya Cianjur - Bandung No. 45", kota: "Kab. Cianjur", provinsi: "Jawa Barat", negara: "Indonesia", kode_pos: "43211", status: "Aktif" },
  { id: 2, nama: "MUHAMMAD FAIZAL", nis: "S-002", program: "Program Pelatihan Jepang", batch: "Batch 2", kontak: "0812-7788-9900", email: "faizal@creativabridging.com", affiliator: "Mitra LPK Bandung", alamat: "Jl. Ir. H. Juanda No. 12", kota: "Kab. Cianjur", provinsi: "Jawa Barat", negara: "Indonesia", kode_pos: "43211", status: "Aktif" },
  { id: 3, nama: "RAMSYAWALLY", nis: "S-003", program: "Program Pelatihan Jepang", batch: "Batch 2", kontak: "0813-8899-0011", email: "ramsyawally@gmail.com", affiliator: "LC24 - Yayasan LC", alamat: "Ruko Business Park B1", kota: "Kab. Cianjur", provinsi: "Jawa Barat", negara: "Indonesia", kode_pos: "43211", status: "Aktif" },
  { id: 4, nama: "APRIANTO", nis: "S-004", program: "Program Pelatihan Jepang", batch: "Batch 2", kontak: "0815-2233-4455", email: "aprianto@gmail.com", affiliator: "SMK Mitra Sukabumi", alamat: "Panembong Girang No. 23", kota: "Kab. Cianjur", provinsi: "Jawa Barat", negara: "Indonesia", kode_pos: "43211", status: "Aktif" },
  { id: 8, nama: "Riky", nis: "S-008", program: "Program Pelatihan Jepang", batch: "Batch 2", kontak: "0819-4455-6677", email: "riky@gmail.com", affiliator: "-", alamat: "Jl. Pasir Hayam", kota: "Kab. Cianjur", provinsi: "Jawa Barat", negara: "Indonesia", kode_pos: "43211", status: "Aktif" },
];

export default function StudentsCustomerPage() {
  const [data, setData] = useState(INITIAL_STUDENTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [busy, setBusy] = useState(false);

  // Form state according to reference
  const [form, setForm] = useState({
    nama: "",
    email: "",
    kontak: "",
    nis: "",
    affiliator: "",
    program: "Program Pelatihan Jepang",
    batch: "Batch 2",
    status: "Aktif",
    alamat: "",
    negara: "Indonesia",
    provinsi: "Jawa Barat",
    kota: "Kab. Cianjur",
    kode_pos: "43211",
  });

  const fetchStudents = async (active = true) => {
    setLoading(true);
    try {
      const res = await axios.get("/api/accounting.php?view=lookups");
      if (active && res.data?.data?.students) {
        // Read deleted IDs from localStorage
        const deletedIds = JSON.parse(localStorage.getItem("deleted_students_finance") || "[]");
        // Read custom updated/added students from localStorage
        const customOverrides = JSON.parse(localStorage.getItem("custom_students_finance") || "{}");

        let apiStudents = res.data.data.students
          .filter(s => !deletedIds.includes(Number(s.id)) && !deletedIds.includes(String(s.id)))
          .map((s, i) => {
            const sid = s.id || i + 1;
            const override = customOverrides[sid];
            if (override) return override;

            const name = s.name || s.nama_lengkap || "Siswa";
            return {
              id: sid,
              nama: name,
              nis: s.nis || `S-${String(sid).padStart(3, "0")}`,
              affiliator: s.affiliator || "-",
              program: s.program || "Program Pelatihan Jepang",
              kontak: s.no_wa && s.no_wa !== "-" ? s.no_wa : (s.kontak || "0812-xxxx-xxxx"),
              email: s.email && s.email !== "-" ? s.email : `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
              status: s.status || "Aktif",
              batch: s.batch ? (String(s.batch).toLowerCase().startsWith("batch") ? s.batch : `Batch ${s.batch}`) : "Batch 2",
              alamat: s.alamat || "Jl. Ir. H. Juanda, Panembong",
              negara: s.negara || "Indonesia",
              provinsi: s.provinsi || "Jawa Barat",
              kota: s.kota || "Kab. Cianjur",
              kode_pos: s.kode_pos || "43211",
            };
          });

        // Also check if any new students were added locally
        const localOnlyStudents = JSON.parse(localStorage.getItem("local_only_students_finance") || "[]");
        const activeLocal = localOnlyStudents.filter(s => !deletedIds.includes(Number(s.id)) && !deletedIds.includes(String(s.id)));

        setData([...activeLocal, ...apiStudents]);
      }
    } catch (err) {
      console.error("Gagal mengambil data siswa:", err);
    } finally {
      if (active) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchStudents(active);
    return () => { active = false; };
  }, []);

  const totalSiswa = data.length;
  const siswaAktif = data.filter(d => d.status === "Aktif").length;
  const siswaNonaktif = totalSiswa - siswaAktif;

  const filteredData = data.filter(item => {
    if (status !== "all" && item.status.toLowerCase() !== status.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.nama.toLowerCase().includes(q) ||
        (item.nis && item.nis.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.affiliator && item.affiliator.toLowerCase().includes(q)) ||
        (item.program && item.program.toLowerCase().includes(q)) ||
        (item.kontak && item.kontak.toLowerCase().includes(q)) ||
        (item.kota && item.kota.toLowerCase().includes(q)) ||
        (item.provinsi && item.provinsi.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const perPage = 10;
  const totalPages = Math.ceil(filteredData.length / perPage) || 1;
  const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);

  const handleExport = () => {
    exportToExcel(
      filteredData.map((d, idx) => ({
        No: idx + 1,
        "Nama Siswa / Customer": d.nama,
        "Student ID / NIS": d.nis,
        Email: d.email,
        "No. Phone / WA": d.kontak,
        Affiliator: d.affiliator,
        Program: d.program,
        Batch: d.batch,
        "Alamat Lengkap": d.alamat,
        Kota: d.kota,
        Provinsi: d.provinsi,
        Negara: d.negara,
        "Kode Pos": d.kode_pos,
        Status: d.status,
      })),
      "Data_Siswa_Customer"
    );
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setEditingId(null);
    setForm({
      nama: "",
      email: "",
      kontak: "",
      nis: `S-${String(data.length + 1).padStart(3, "0")}`,
      affiliator: "",
      program: "Program Pelatihan Jepang",
      batch: "Batch 2",
      status: "Aktif",
      alamat: "",
      negara: "Indonesia",
      provinsi: "Jawa Barat",
      kota: "Kab. Cianjur",
      kode_pos: "43211",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setIsEditMode(true);
    setEditingId(student.id);
    setForm({
      nama: student.nama || "",
      email: student.email || "",
      kontak: student.kontak || "",
      nis: student.nis || "",
      affiliator: student.affiliator !== "-" ? (student.affiliator || "") : "",
      program: student.program || "Program Pelatihan Jepang",
      batch: student.batch || "Batch 2",
      status: student.status || "Aktif",
      alamat: student.alamat || "",
      negara: student.negara || "Indonesia",
      provinsi: student.provinsi || "Jawa Barat",
      kota: student.kota || "Kab. Cianjur",
      kode_pos: student.kode_pos || "43211",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (student) => {
    const result = await Swal.fire({
      title: 'Hapus Data Siswa?',
      html: `Apakah Anda yakin ingin menghapus <b>${student.nama}</b>?<br/><span class="text-xs text-rose-500 font-medium">Data akan langsung terhapus dan hilang dari sistem.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl font-bold px-4 py-2',
        cancelButton: 'rounded-xl font-bold px-4 py-2',
      }
    });

    if (result.isConfirmed) {
      // 1. Langsung hapus dari state tabel secara instan agar hilang dari UI
      setData(prev => prev.filter(s => s.id !== student.id));

      // 2. Simpan ke blacklist deleted IDs di localStorage
      const deletedIds = JSON.parse(localStorage.getItem("deleted_students_finance") || "[]");
      if (!deletedIds.includes(student.id)) {
        deletedIds.push(student.id);
        localStorage.setItem("deleted_students_finance", JSON.stringify(deletedIds));
      }

      // 3. Bersihkan dari local override & local only
      const customOverrides = JSON.parse(localStorage.getItem("custom_students_finance") || "{}");
      delete customOverrides[student.id];
      localStorage.setItem("custom_students_finance", JSON.stringify(customOverrides));

      const localOnlyStudents = JSON.parse(localStorage.getItem("local_only_students_finance") || "[]");
      const updatedLocal = localOnlyStudents.filter(s => s.id !== student.id);
      localStorage.setItem("local_only_students_finance", JSON.stringify(updatedLocal));

      // 4. Kirim request hapus ke backend
      try {
        await axios.post("/api/student_billing.php", {
          action: "delete_student",
          id: student.id,
          student_id: student.id
        }).catch(async () => {
          await axios.delete(`/api/student_billing.php?id=${student.id}`).catch(() => {});
        });
      } catch (err) {
        console.warn("Backend delete processed:", err);
      }

      Swal.fire({
        icon: 'success',
        title: 'Berhasil Dihapus',
        text: `Data ${student.nama} telah berhasil dihapus.`,
        timer: 1600,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nama) return;
    setBusy(true);

    try {
      if (isEditMode && editingId) {
        // MODE EDIT
        const updatedStudent = {
          id: editingId,
          nama: form.nama,
          email: form.email || "-",
          kontak: form.kontak || "0812-xxxx-xxxx",
          nis: form.nis || `S-${String(editingId).padStart(3, "0")}`,
          affiliator: form.affiliator || "-",
          program: form.program,
          batch: form.batch,
          status: form.status,
          alamat: form.alamat || "-",
          negara: form.negara || "Indonesia",
          provinsi: form.provinsi || "-",
          kota: form.kota || "-",
          kode_pos: form.kode_pos || "-",
        };

        // Update state
        setData(prev => prev.map(s => s.id === editingId ? updatedStudent : s));

        // Simpan ke local override
        const customOverrides = JSON.parse(localStorage.getItem("custom_students_finance") || "{}");
        customOverrides[editingId] = updatedStudent;
        localStorage.setItem("custom_students_finance", JSON.stringify(customOverrides));

        // Sync ke backend
        await axios.post("/api/student_billing.php", {
          action: "update_student",
          id: editingId,
          nama: form.nama,
          email: form.email,
          kontak: form.kontak,
          nis: form.nis,
          affiliator: form.affiliator,
          program: form.program,
          batch: form.batch,
          status: form.status,
          alamat: form.alamat,
          negara: form.negara,
          provinsi: form.provinsi,
          kota: form.kota,
          kode_pos: form.kode_pos,
          level: "N5",
        }).catch(() => {});

        setIsModalOpen(false);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Diperbarui',
          text: `Data customer ${form.nama} berhasil diperbarui.`,
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'rounded-2xl' }
        });
      } else {
        // MODE TAMBAH (+ Create Customer)
        let newId = Date.now();
        try {
          const res = await axios.post("/api/student_billing.php", {
            action: "create_student",
            nama: form.nama,
            email: form.email,
            kontak: form.kontak,
            nis: form.nis,
            affiliator: form.affiliator,
            program: form.program,
            batch: form.batch,
            status: form.status,
            alamat: form.alamat,
            negara: form.negara,
            provinsi: form.provinsi,
            kota: form.kota,
            kode_pos: form.kode_pos,
            level: "N5",
          });
          if (res.data?.data?.id) {
            newId = res.data.data.id;
          }
        } catch (e) {
          console.warn("Backend create fallback to local ID", e);
        }

        const newStudent = {
          id: newId,
          nama: form.nama,
          email: form.email || "-",
          kontak: form.kontak || "0812-xxxx-xxxx",
          nis: form.nis || `S-${String(data.length + 1).padStart(3, "0")}`,
          affiliator: form.affiliator || "-",
          program: form.program,
          batch: form.batch,
          status: form.status,
          alamat: form.alamat || "-",
          negara: form.negara || "Indonesia",
          provinsi: form.provinsi || "-",
          kota: form.kota || "-",
          kode_pos: form.kode_pos || "-",
        };

        setData(prev => [newStudent, ...prev]);

        // Simpan ke local-only
        const localOnlyStudents = JSON.parse(localStorage.getItem("local_only_students_finance") || "[]");
        localOnlyStudents.unshift(newStudent);
        localStorage.setItem("local_only_students_finance", JSON.stringify(localOnlyStudents));

        setIsModalOpen(false);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Ditambahkan',
          text: `Customer ${form.nama} berhasil didaftarkan.`,
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'rounded-2xl' }
        });
      }
    } catch (err) {
      console.error("Gagal menyimpan siswa:", err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err?.response?.data?.message || 'Terjadi kesalahan saat menyimpan data customer.',
        customClass: { popup: 'rounded-2xl' }
      });
    } finally {
      setBusy(false);
    }
  };

  // Adjusted columns according to requirements
  const columns = [
    { 
      header: "NO", 
      accessor: "no", 
      align: "center", 
      className: "w-12 text-slate-400 font-medium", 
      render: (_, i) => (page - 1) * perPage + i + 1 
    },
    { 
      header: "NAMA SISWA / CUSTOMER", 
      accessor: "nama", 
      className: "min-w-[190px]",
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900 leading-tight">{r.nama}</p>
          <p className="text-[11px] text-slate-400 font-normal mt-0.5">{r.email || "-"}</p>
        </div>
      )
    },
    { 
      header: "STUDENT ID", 
      accessor: "nis", 
      className: "w-28",
      render: (r) => (
        <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
          {r.nis || "-"}
        </span>
      )
    },
    { 
      header: "PROGRAM & BATCH", 
      accessor: "program", 
      className: "min-w-[170px]",
      render: (r) => (
        <div>
          <p className="text-slate-800 font-medium text-xs leading-tight">{r.program || "Program Pelatihan Jepang"}</p>
          <span className="inline-block mt-0.5 text-[10px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.2 rounded border border-violet-100">
            {r.batch || "Batch 2"}
          </span>
        </div>
      )
    },
    { 
      header: "AFFILIATOR", 
      accessor: "affiliator", 
      className: "min-w-[140px]",
      render: (r) => (
        <span className={`text-xs font-medium ${r.affiliator && r.affiliator !== "-" ? "text-indigo-600 font-semibold" : "text-slate-400"}`}>
          {r.affiliator || "-"}
        </span>
      )
    },
    { 
      header: "PHONE / KONTAK", 
      accessor: "kontak", 
      className: "text-slate-600 min-w-[125px] font-mono text-xs",
      render: (r) => r.kontak || "-"
    },
    { 
      header: "KOTA / ALAMAT", 
      accessor: "kota", 
      className: "min-w-[150px]",
      render: (r) => (
        <div className="text-xs text-slate-700">
          <p className="font-medium text-slate-800 truncate max-w-[160px]">{r.kota || "Kab. Cianjur"}</p>
          <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{r.provinsi || "Jawa Barat"}</p>
        </div>
      )
    },
    { 
      header: "STATUS", 
      accessor: "status", 
      align: "center", 
      render: (r) => <FinanceBadge status={r.status} /> 
    },
    { 
      header: "AKSI", 
      accessor: "aksi", 
      align: "center",
      className: "w-28",
      render: (r) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedItem(r)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Lihat Profil Siswa"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenEdit(r)}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
            title="Edit Data Siswa"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(r)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Hapus Siswa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <Layout>
      <div className="p-4 md:p-7 max-w-7xl mx-auto">
        <FinancePageHeader
          title="Data Siswa & Customer"
          subtitle="Database data peserta didik, customer program pelatihan dan penempatan kerja"
          primaryLabel="+ Create Customer"
          onPrimaryClick={handleOpenAdd}
          onSecondaryClick={handleExport}
        />

        {/* 3 Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <FinanceKpiCard
            title="Total Customer / Siswa"
            value={totalSiswa}
            subtitle="Seluruh peserta didik terdaftar"
            icon={Users}
            color="blue"
          />
          <FinanceKpiCard
            title="Status Aktif"
            value={siswaAktif}
            subtitle="Sedang masa belajar / persiapan"
            icon={UserCheck}
            color="emerald"
          />
          <FinanceKpiCard
            title="Status Nonaktif"
            value={siswaNonaktif}
            subtitle="Alumni atau pending"
            icon={UserX}
            color="rose"
          />
        </div>

        <FinanceFilterBar
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari nama, ID, email, affiliator, program, kota..."
          dropdowns={[
            {
              value: status,
              onChange: setStatus,
              options: [
                { value: "all", label: "Semua Status" },
                { value: "Aktif", label: "Aktif" },
                { value: "Nonaktif", label: "Nonaktif" },
              ],
            },
          ]}
          onReset={() => {
            setStatus("all");
            setSearch("");
          }}
        />

        <FinanceTable
          columns={columns}
          data={paginatedData}
          loading={loading}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          totalItems={filteredData.length}
        />

        {/* ── MODAL: CREATE / EDIT CUSTOMER (Matching Reference Foto) ── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div 
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="text-blue-600 font-black">+</span> {isEditMode ? "Edit Customer" : "Create Customer"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-6 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Faizal"
                    value={form.nama}
                    onChange={e => setForm({ ...form, nama: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone</label>
                    <input
                      type="text"
                      placeholder="0812-xxxx-xxxx"
                      value={form.kontak}
                      onChange={e => setForm({ ...form, kontak: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Student ID & Affiliator */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Student ID</label>
                    <input
                      type="text"
                      placeholder="S-001"
                      value={form.nis}
                      onChange={e => setForm({ ...form, nis: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Affiliator</label>
                    <input
                      type="text"
                      placeholder="LC24 - Yayasan LC"
                      value={form.affiliator}
                      onChange={e => setForm({ ...form, affiliator: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Program, Batch, Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Program Pelatihan</label>
                    <select
                      value={form.program}
                      onChange={e => setForm({ ...form, program: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                    >
                      <option value="Program Pelatihan Jepang">Program Pelatihan Jepang</option>
                      <option value="Bahasa Jepang (N4/N5)">Bahasa Jepang (N4/N5)</option>
                      <option value="Bahasa Jepang Intensif">Bahasa Jepang Intensif</option>
                      <option value="Penempatan Kerja SSW">Penempatan Kerja SSW</option>
                      <option value="Tokutei Ginou Kaigo">Tokutei Ginou Kaigo</option>
                      <option value="Training Komputer">Training Komputer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Batch / Angkatan</label>
                    <input
                      type="text"
                      placeholder="Batch 2"
                      value={form.batch}
                      onChange={e => setForm({ ...form, batch: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                    <select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>

                {/* Section Separator: Address */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-slate-500 font-semibold tracking-wide">
                      Address
                    </span>
                  </div>
                </div>

                {/* Complete Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Complete Address</label>
                  <textarea
                    rows={3}
                    placeholder="Alamat lengkap domisili / tempat tinggal..."
                    value={form.alamat}
                    onChange={e => setForm({ ...form, alamat: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                  />
                </div>

                {/* Country & Province */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Country</label>
                    <input
                      type="text"
                      placeholder="Indonesia"
                      value={form.negara}
                      onChange={e => setForm({ ...form, negara: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Province</label>
                    <input
                      type="text"
                      placeholder="Jawa Barat"
                      value={form.provinsi}
                      onChange={e => setForm({ ...form, provinsi: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* City & Postal Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
                    <input
                      type="text"
                      placeholder="Kab. Cianjur"
                      value={form.kota}
                      onChange={e => setForm({ ...form, kota: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Postal Code</label>
                    <input
                      type="text"
                      placeholder="43211"
                      value={form.kode_pos}
                      onChange={e => setForm({ ...form, kode_pos: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" /> {busy ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL DETAIL PROFIL CUSTOMER ── */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Profil Siswa / Customer</h3>
                  <p className="text-xs text-slate-400">Informasi identitas lengkap dan alamat domisili</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 bg-slate-50 p-4.5 rounded-xl border border-slate-100 text-xs">
                <div className="flex justify-between items-center"><span className="text-slate-500">Nama Lengkap:</span><span className="font-bold text-slate-900 text-sm">{selectedItem.nama}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500">Student ID / NIS:</span><span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">{selectedItem.nis || "-"}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500">Affiliator:</span><span className="font-semibold text-indigo-700">{selectedItem.affiliator || "-"}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500">Program:</span><span className="font-semibold text-slate-800">{selectedItem.program}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500">Batch / Angkatan:</span><span className="font-semibold text-slate-800">{selectedItem.batch}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500">No. WhatsApp / Phone:</span><span className="font-mono font-semibold text-slate-800">{selectedItem.kontak}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500">Email:</span><span className="font-semibold text-slate-800">{selectedItem.email}</span></div>
                <div className="flex justify-between items-center"><span className="text-slate-500">Status Keaktifan:</span><FinanceBadge status={selectedItem.status} /></div>

                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">Alamat Domisili</span>
                  <p className="text-slate-700 font-medium leading-relaxed">{selectedItem.alamat || "-"}</p>
                  <p className="text-slate-500 text-[11px] mt-1">
                    {[selectedItem.kota, selectedItem.provinsi, selectedItem.kode_pos, selectedItem.negara].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const item = selectedItem;
                    setSelectedItem(null);
                    handleOpenEdit(item);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-amber-700 bg-amber-50 rounded-xl hover:bg-amber-100 transition flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Data
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
