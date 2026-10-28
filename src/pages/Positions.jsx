import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { Users, Briefcase, DollarSign, Network, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, RotateCcw, Save } from "lucide-react";

const POSITIONS_API_URL = "/api/positions.php";
const DEPARTMENTS_API_URL = "/api/departments.php";
const ITEMS_PER_PAGE = 8;

export default function Positions() {
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState({
    id: null,
    name: "",
    department_id: "",
    level: "Staff",
    base_salary: 0,
    tunjangan: 0,
    is_active: 1,
    description: ""
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [posRes, deptRes] = await Promise.all([
        axios.get(POSITIONS_API_URL),
        axios.get(DEPARTMENTS_API_URL)
      ]);
      setPositions(posRes.data?.data || []);
      setDepartments(deptRes.data?.data || []);
      setErrorMessage("");
    } catch (error) {
      console.error("Error fetching data:", error);
      setErrorMessage("Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.level) {
      setErrorMessage("Nama dan Level Jabatan wajib diisi.");
      return;
    }

    try {
      if (form.id) {
        await axios.put(POSITIONS_API_URL, form);
        alert("Jabatan berhasil diupdate.");
      } else {
        await axios.post(POSITIONS_API_URL, form);
        alert("Jabatan berhasil ditambahkan.");
      }
      handleReset();
      fetchData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Gagal menyimpan data.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus jabatan ini?")) return;
    try {
      await axios.delete(POSITIONS_API_URL, { data: { id } });
      fetchData();
    } catch {
      alert("Gagal menghapus jabatan. Mungkin masih digunakan oleh karyawan.");
    }
  };

  const handleEdit = (pos) => {
    setForm({
      id: pos.id,
      name: pos.name,
      department_id: pos.department_id || "",
      level: pos.level || "Staff",
      base_salary: pos.base_salary || 0,
      tunjangan: pos.tunjangan || 0,
      is_active: pos.is_active !== undefined ? Number(pos.is_active) : 1,
      description: pos.description || ""
    });
  };

  const handleReset = () => {
    setForm({
      id: null,
      name: "",
      department_id: "",
      level: "Staff",
      base_salary: 0,
      tunjangan: 0,
      is_active: 1,
      description: ""
    });
    setErrorMessage("");
  };

  // Filter Logic
  const filteredPositions = positions.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.department_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "Semua Status" || 
                          (statusFilter === "Aktif" && p.is_active == 1) || 
                          (statusFilter === "Nonaktif" && p.is_active == 0);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPositions.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPositions = filteredPositions.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  // Stats Logic
  const totalJabatan = positions.length;
  const jabatanAktif = positions.filter(p => p.is_active == 1).length;
  const avgSalary = positions.length > 0 
    ? positions.reduce((acc, p) => acc + Number(p.base_salary), 0) / positions.length 
    : 0;
  const deptsConnected = new Set(positions.map(p => p.department_id).filter(Boolean)).size;

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-12">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
          
          {/* HERO BANNER dengan Efek "3D" */}
          <div className="relative w-full h-[160px] sm:h-[180px] rounded-[2rem] overflow-hidden shadow-lg bg-[#eef2ff] flex items-center border border-blue-100">
            {/* Latar Belakang Gambar */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2000&auto=format&fit=crop')`,
                backgroundPosition: 'center 30%',
              }}
            />
            {/* Gradient Overlay dari biru solid ke transparan */}
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-blue-700 via-blue-600/95 to-transparent"></div>
            
            <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center px-8 md:px-12">
              <div className="max-w-xl text-white">
                <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight drop-shadow-md">Position Master</h1>
                <p className="text-blue-50 text-[14px] md:text-[15px] font-medium leading-relaxed drop-shadow-sm">Kelola data jabatan, struktur posisi, dan standar gaji.</p>
              </div>
              <div className="hidden lg:block text-right italic text-blue-50 text-sm max-w-xs border-r border-blue-300/40 pr-6 drop-shadow-sm">
                "SDM unggul untuk masa depan yang lebih baik"
              </div>
            </div>
          </div>

          {/* STATS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: "Total Jabatan", val: totalJabatan, icon: Users, color: "blue", bg: "bg-blue-50", text: "text-blue-500", inc: "Total sistem" },
              { label: "Jabatan Aktif", val: jabatanAktif, icon: Briefcase, color: "emerald", bg: "bg-emerald-50", text: "text-emerald-500", inc: "Status aktif" },
              { label: "Rata-rata Gaji Pokok", val: `Rp ${Math.round(avgSalary).toLocaleString('id-ID')}`, icon: DollarSign, color: "purple", bg: "bg-purple-50", text: "text-purple-500", inc: "Seluruh jabatan" },
              { label: "Departemen Terhubung", val: deptsConnected, icon: Network, color: "orange", bg: "bg-orange-50", text: "text-orange-500", inc: "Memiliki jabatan" },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition">
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-12 h-12 rounded-[1rem] ${stat.bg} flex items-center justify-center ${stat.text}`}>
                    <stat.icon className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-500 mb-1">{stat.label}</p>
                  <h3 className="text-[22px] font-black text-slate-800">{stat.val}</h3>
                  <p className={`text-[11px] font-bold ${stat.text} mt-1`}>{stat.inc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEFT COLUMN: FORM */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 sm:p-8 lg:col-span-1">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    {form.id ? <Edit2 className="w-5 h-5" /> : "+"}
                  </div>
                  <h2 className="text-[18px] font-black text-slate-800">{form.id ? "Edit Jabatan" : "Tambah Jabatan"}</h2>
                </div>
                {form.id && (
                  <button onClick={handleReset} className="px-3 py-1.5 text-[12px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                    + Buat Baru
                  </button>
                )}
              </div>

              {errorMessage && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-600 text-center">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-700">Nama Jabatan <span className="text-red-500">*</span></span>
                  <input required type="text" placeholder="Contoh: Manager IT" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[14px] font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white" />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-700">Departemen</span>
                  <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[14px] font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white">
                    <option value="">Tidak ada / Pilih Departemen</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-700">Level Jabatan <span className="text-red-500">*</span></span>
                  <select required value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[14px] font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white">
                    <option value="Staff">Staff</option>
                    <option value="Specialist">Specialist</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Manager">Manager</option>
                    <option value="Director">Director</option>
                    <option value="C-Level">C-Level</option>
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-bold text-slate-700">Gaji Pokok (Rp) <span className="text-red-500">*</span></span>
                    <input required type="number" placeholder="0" value={form.base_salary} onChange={(e) => setForm({ ...form, base_salary: e.target.value })} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[14px] font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-[12px] font-bold text-slate-700">Tunjangan (Rp)</span>
                    <input type="number" placeholder="0" value={form.tunjangan} onChange={(e) => setForm({ ...form, tunjangan: e.target.value })} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[14px] font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white" />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-700">Status <span className="text-red-500">*</span></span>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
                      <div className={`w-2 h-2 rounded-full ${form.is_active == 1 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    </div>
                    <select required value={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.value })} className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-8 pr-4 text-[14px] font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white">
                      <option value={1}>Aktif</option>
                      <option value={0}>Nonaktif</option>
                    </select>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[12px] font-bold text-slate-700">Deskripsi Singkat</span>
                  <textarea rows="3" placeholder="Masukkan deskripsi singkat mengenai jabatan ini..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[13px] font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white resize-none"></textarea>
                </label>

                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={handleReset} className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition active:scale-[0.98]">
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                  <button type="submit" className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 text-[14px] font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition active:scale-[0.98]">
                    <Save className="w-4 h-4" /> Simpan
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: TABLE */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 lg:col-span-2 overflow-hidden flex flex-col">
              {/* Header Table */}
              <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h2 className="text-[18px] font-black text-slate-800">Daftar Jabatan</h2>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" placeholder="Cari nama jabatan, departemen..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-11 w-full sm:w-64 pl-10 pr-4 rounded-full border border-slate-200 bg-slate-50 text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition" />
                  </div>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-full border border-slate-200 bg-slate-50 px-4 text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition">
                    <option value="Semua Status">Semua Status</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Table Data */}
              {isLoading ? (
                <div className="p-12 text-center text-[13px] font-semibold text-slate-500">Memuat data jabatan...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-slate-100">
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider w-16">No</th>
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Nama Jabatan</th>
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Departemen</th>
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Level</th>
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Gaji Pokok</th>
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Jml Karyawan</th>
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                      {paginatedPositions.map((pos, index) => (
                        <tr key={pos.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 text-[13px] font-bold text-slate-400">{pageStart + index + 1}</td>
                          <td className="px-6 py-4">
                            <span className="text-[13px] font-black text-slate-800">{pos.name}</span>
                          </td>
                          <td className="px-6 py-4 text-[13px] font-semibold text-slate-500">
                            {pos.department_name || "-"}
                          </td>
                          <td className="px-6 py-4 text-[13px] font-semibold text-slate-500">
                            {pos.level || "-"}
                          </td>
                          <td className="px-6 py-4 text-[13px] font-semibold text-slate-600">
                            Rp {Number(pos.base_salary || 0).toLocaleString("id-ID")}
                          </td>
                          <td className="px-6 py-4 text-[13px] font-semibold text-slate-500 text-center">
                            {pos.emp_count || 0}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${pos.is_active == 1 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                              <span className={`text-[12px] font-bold ${pos.is_active == 1 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {pos.is_active == 1 ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => alert(pos.description || "Tidak ada deskripsi.")} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleEdit(pos)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(pos.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {paginatedPositions.length === 0 && (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-[13px] font-semibold text-slate-400">
                            {searchQuery ? "Tidak ada jabatan yang sesuai pencarian." : "Belum ada data jabatan."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-white rounded-b-[2rem]">
                  <p className="text-[12px] font-semibold text-slate-400">
                    Menampilkan {pageStart + 1} - {Math.min(pageStart + ITEMS_PER_PAGE, filteredPositions.length)} dari {filteredPositions.length} jabatan
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safeCurrentPage === 1} className="h-9 px-3 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1) {
                        return (
                          <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 flex items-center justify-center rounded-xl text-[13px] font-bold transition ${safeCurrentPage === page ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            {page}
                          </button>
                        );
                      }
                      if (Math.abs(page - safeCurrentPage) === 2) return <span key={page} className="px-1 text-slate-400 font-bold">...</span>;
                      return null;
                    })}
                    <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages} className="h-9 px-3 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
