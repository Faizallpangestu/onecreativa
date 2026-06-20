import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Crown } from "lucide-react";

const POSITIONS_API_URL = "/api/positions.php";

export default function Positions() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({ id: null, name: "", base_salary: 0 });

  const fetchPositions = async () => {
    try {
      const res = await axios.get(POSITIONS_API_URL);
      setPositions(res.data?.data || []);
      setErrorMessage("");
    } catch (error) {
      console.error("Error fetch positions:", error);
      setErrorMessage("Gagal memuat data jabatan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      setErrorMessage("Nama jabatan wajib diisi.");
      return;
    }

    try {
      if (form.id) {
        await axios.put(POSITIONS_API_URL, form);
        alert("Jabatan & Gaji berhasil diupdate.");
      } else {
        await axios.post(POSITIONS_API_URL, form);
        alert("Jabatan berhasil ditambahkan.");
      }
      setForm({ id: null, name: "", base_salary: 0 });
      setErrorMessage("");
      fetchPositions();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Gagal menyimpan data.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus jabatan ini?")) return;
    try {
      await axios.delete(POSITIONS_API_URL, { data: { id } });
      fetchPositions();
    } catch (error) {
      alert("Gagal menghapus jabatan. Mungkin masih digunakan oleh karyawan.");
    }
  };

  const handleEdit = (pos) => {
    setForm({ id: pos.id, name: pos.name, base_salary: pos.base_salary || 0 });
  };

  const filteredPositions = positions.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50 pb-12 relative overflow-hidden">

        {/* Background Gradient */}
        <div className="absolute top-0 left-0 right-0 h-[200px] bg-gradient-to-br from-amber-600 via-amber-500 to-orange-600 rounded-b-[2.5rem] shadow-md z-0">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white rounded-full blur-3xl opacity-10 pointer-events-none"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 px-5 pt-8 pb-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition active:scale-95"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <h1 className="text-[17px] font-black text-white tracking-wide">Master Jabatan</h1>
            <div className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full">
              <Crown className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-white/80 text-[13px] font-semibold">Kelola jabatan dan gaji pokok karyawan</p>
        </div>

        {/* Content */}
        <div className="relative z-10 px-5 mt-2">

        {errorMessage && (
          <div className="mb-8 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm h-fit">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              {form.id ? "Edit Jabatan" : "Tambah Jabatan"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Nama Jabatan</span>
                <input
                  type="text"
                  placeholder="Misal: Manager IT"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-300"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Gaji Pokok (Rp)</span>
                <input
                  type="number"
                  placeholder="Misal: 5000000"
                  value={form.base_salary}
                  onChange={(e) => setForm({ ...form, base_salary: e.target.value })}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-blue-300"
                />
              </label>
              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                {form.id ? "Simpan Perubahan" : "Tambah Baru"}
              </button>
              {form.id && (
                <button
                  type="button"
                  onClick={() => setForm({ id: null, name: "", base_salary: 0 })}
                  className="w-full h-12 rounded-xl bg-slate-100 px-6 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 mt-2"
                >
                  Batal Edit
                </button>
              )}
            </form>
          </section>

          {/* Table */}
          <section className="lg:col-span-2 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 sm:p-6 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Daftar Jabatan</h2>
              <input
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full sm:w-64 rounded-full border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-300"
              />
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">Memuat data...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-white border-b border-slate-100">
                    <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">Nama Jabatan</th>
                      <th className="px-6 py-4">Gaji Pokok</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPositions.map((pos) => (
                      <tr key={pos.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{pos.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          Rp {Number(pos.base_salary || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(pos)}
                              className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition"
                            >
                              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                                <path d="m4 20 4.5-1 9-9a2.1 2.1 0 1 0-3-3l-9 9L4 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(pos.id)}
                              className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition"
                            >
                              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                                <path d="M5 7h14M10 11v5m4-5v5M9 4h6l1 3H8l1-3Zm-2 3h10l-.8 11.2a1 1 0 0 1-1 .8H8.8a1 1 0 0 1-1-.8L7 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPositions.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-sm text-slate-500">
                          Belum ada data jabatan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
        </div>
      </div>
    </Layout>
  );
}
