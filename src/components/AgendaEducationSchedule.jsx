import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Download,
  Search,
  Users,
  Building2,
  Sparkles,
  X,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { fieldClass, buttonClass, secondaryButtonClass } from './ModuleFrame';

export default function AgendaEducationSchedule() {
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCabang, setFilterCabang] = useState('ALL');
  const [filterTahun, setFilterTahun] = useState('2026');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    id: null,
    cabang: 'CJR',
    batch: '',
    program: 'Program Intensif',
    tahun: 2026,
    kapasitas_p: 16,
    kapasitas_l: 0,
    kapasitas_total: 16,
    kuota_p: 16,
    kuota_l: 0,
    kuota_total: 16,
    kuota_keterangan: 'P = 16',
    est_pra_pendidikan: '',
    est_kedatangan_asrama: '',
    est_mulai_offline: '',
    act_pra_pendidikan: '',
    act_kedatangan_asrama: '',
    act_mulai_offline: '',
    status: 'Aktif',
    notes: ''
  };

  const [formData, setFormData] = useState(initialForm);

  // Fetch Agendas
  const fetchAgendas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/lms_agenda_pendidikan.php');
      if (res.data && res.data.status === 'success') {
        setAgendas(res.data.data || []);
      } else {
        setError(res.data?.message || 'Gagal mengambil data agenda.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Koneksi ke backend gagal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgendas();
  }, [fetchAgendas]);

  // Handle Form Change with Auto Calculations
  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === 'kapasitas_p' || field === 'kapasitas_l') {
        const p = parseInt(field === 'kapasitas_p' ? value : prev.kapasitas_p, 10) || 0;
        const l = parseInt(field === 'kapasitas_l' ? value : prev.kapasitas_l, 10) || 0;
        updated.kapasitas_total = p + l;
      }

      if (field === 'kuota_p' || field === 'kuota_l') {
        const p = parseInt(field === 'kuota_p' ? value : prev.kuota_p, 10) || 0;
        const l = parseInt(field === 'kuota_l' ? value : prev.kuota_l, 10) || 0;
        updated.kuota_total = p + l;
        if (!prev.kuota_keterangan || prev.kuota_keterangan.startsWith('P =')) {
          updated.kuota_keterangan = l > 0 ? `P = ${p}, L = ${l}` : `P = ${p}`;
        }
      }

      return updated;
    });
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (agenda) => {
    setIsEditing(true);
    setFormData({
      id: agenda.id,
      cabang: agenda.cabang || 'CJR',
      batch: agenda.batch || '',
      program: agenda.program || 'Program Intensif',
      tahun: agenda.tahun || 2026,
      kapasitas_p: agenda.kapasitas_p ?? 0,
      kapasitas_l: agenda.kapasitas_l ?? 0,
      kapasitas_total: agenda.kapasitas_total ?? 0,
      kuota_p: agenda.kuota_p ?? 0,
      kuota_l: agenda.kuota_l ?? 0,
      kuota_total: agenda.kuota_total ?? 0,
      kuota_keterangan: agenda.kuota_keterangan || '',
      est_pra_pendidikan: agenda.est_pra_pendidikan || '',
      est_kedatangan_asrama: agenda.est_kedatangan_asrama || '',
      est_mulai_offline: agenda.est_mulai_offline || '',
      act_pra_pendidikan: agenda.act_pra_pendidikan || '',
      act_kedatangan_asrama: agenda.act_kedatangan_asrama || '',
      act_mulai_offline: agenda.act_mulai_offline || '',
      status: agenda.status || 'Aktif',
      notes: agenda.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cabang || !formData.batch) {
      Swal.fire('Peringatan', 'Cabang dan Batch wajib diisi.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post('/api/lms_agenda_pendidikan.php', formData);
      if (res.data && res.data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: isEditing ? 'Agenda berhasil diperbarui.' : 'Agenda berhasil ditambahkan.',
          timer: 1500,
          showConfirmButton: false
        });
        setIsModalOpen(false);
        fetchAgendas();
      } else {
        Swal.fire('Gagal', res.data?.message || 'Gagal menyimpan.', 'error');
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, batchName) => {
    Swal.fire({
      title: 'Hapus Agenda?',
      text: `Apakah Anda yakin ingin menghapus ${batchName}? Tindakan ini tidak dapat dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axios.delete(`/api/lms_agenda_pendidikan.php?id=${id}`);
          if (res.data && res.data.status === 'success') {
            Swal.fire('Terhapus!', 'Jadwal agenda berhasil dihapus.', 'success');
            fetchAgendas();
          } else {
            Swal.fire('Gagal', res.data?.message || 'Gagal menghapus.', 'error');
          }
        } catch (err) {
          Swal.fire('Error', err.response?.data?.message || 'Gagal menghapus.', 'error');
        }
      }
    });
  };

  const handleExportExcel = () => {
    if (agendas.length === 0) {
      Swal.fire('Informasi', 'Tidak ada data untuk diekspor.', 'info');
      return;
    }

    const exportRows = agendas.map((item, idx) => ({
      'No': idx + 1,
      'Cabang': item.cabang,
      'Batch': item.batch,
      'Program': item.program,
      'Tahun': item.tahun,
      'Kapasitas (P)': item.kapasitas_p,
      'Kapasitas (L)': item.kapasitas_l,
      'Total Kapasitas': item.kapasitas_total,
      'Jumlah Peserta (P)': item.kuota_p,
      'Jumlah Peserta (L)': item.kuota_l,
      'Total Peserta': item.kuota_total,
      'Keterangan Kuota': item.kuota_keterangan,
      'Estimasi Pra Pendidikan': item.est_pra_pendidikan,
      'Estimasi Kedatangan Asrama': item.est_kedatangan_asrama,
      'Estimasi Mulai Offline': item.est_mulai_offline,
      'Aktual Pra Pendidikan': item.act_pra_pendidikan,
      'Aktual Kedatangan Asrama': item.act_kedatangan_asrama,
      'Aktual Mulai Offline': item.act_mulai_offline,
      'Status': item.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rencana Penjadwalan');
    XLSX.writeFile(workbook, `Rencana_Penjadwalan_LPK_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const filteredAgendas = agendas.filter((item) => {
    const matchSearch = `${item.cabang} ${item.batch} ${item.program} ${item.kuota_keterangan}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchCabang = filterCabang === 'ALL' || item.cabang === filterCabang;
    const matchTahun = filterTahun === 'ALL' || String(item.tahun) === filterTahun;
    return matchSearch && matchCabang && matchTahun;
  });

  const totalBatch = filteredAgendas.length;
  const totalKapasitas = filteredAgendas.reduce((acc, cur) => acc + (parseInt(cur.kapasitas_total, 10) || 0), 0);
  const totalPeserta = filteredAgendas.reduce((acc, cur) => acc + (parseInt(cur.kuota_total, 10) || 0), 0);
  const totalSisaKuota = Math.max(0, totalKapasitas - totalPeserta);
  const uniqueCabang = Array.from(new Set(agendas.map((a) => a.cabang).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Batch</div>
            <div className="text-xl font-black text-slate-800">{totalBatch}</div>
            <div className="text-[10px] text-slate-500 font-medium">Jadwal Terdaftar</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kapasitas Kelas</div>
            <div className="text-xl font-black text-slate-800">{totalKapasitas}</div>
            <div className="text-[10px] text-slate-500 font-medium">Total Kursi Kelas</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Peserta Terisi</div>
            <div className="text-xl font-black text-slate-800">{totalPeserta}</div>
            <div className="text-[10px] text-slate-500 font-medium">Kuota Terisi</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sisa Kuota</div>
            <div className="text-xl font-black text-slate-800">{totalSisaKuota}</div>
            <div className="text-[10px] text-slate-500 font-medium">Kursi Tersedia</div>
          </div>
        </div>
      </div>

      {/* CONTROLS & ACTION BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative min-w-[240px] flex-1 md:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari cabang, batch, program..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <select
            value={filterCabang}
            onChange={(e) => setFilterCabang(e.target.value)}
            className="py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none cursor-pointer text-slate-700"
          >
            <option value="ALL">Semua Cabang</option>
            {uniqueCabang.map((c) => (
              <option key={c} value={c}>
                Cabang {c}
              </option>
            ))}
          </select>

          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
            className="py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none cursor-pointer text-slate-700"
          >
            <option value="ALL">Semua Tahun</option>
            <option value="2025">Tahun 2025</option>
            <option value="2026">Tahun 2026</option>
            <option value="2027">Tahun 2027</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={fetchAgendas}
            className={secondaryButtonClass}
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0c2e59] to-[#1a56db] hover:from-[#0a2547] hover:to-[#1648b8] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Agenda</span>
          </button>
        </div>
      </div>

      {/* SPREADSHEET TABLE: RENCANA PENJADWALAN PROGRAM INTENSIF */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Header Banner */}
        <div className="bg-[#f1f5f9] border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
              RENCANA PENJADWALAN PROGRAM INTENSIF {filterTahun !== 'ALL' ? filterTahun : '2026'}
            </h2>
            <div className="text-xs font-extrabold text-blue-700 tracking-wider">LPK CREATIVA</div>
          </div>
          <div className="text-[11px] font-bold text-slate-500">
            Total {filteredAgendas.length} Baris Jadwal
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#e2e8f0] text-slate-700 font-black tracking-wider uppercase text-[11px] border-b border-slate-300">
                <th className="py-3 px-4 border-r border-slate-300 w-24 text-center">CABANG</th>
                <th className="py-3 px-4 border-r border-slate-300 min-w-[200px]">BATCH</th>
                <th className="py-3 px-4 border-r border-slate-300 w-36 text-center">KAPASITAS KELAS</th>
                <th className="py-3 px-4 border-r border-slate-300 w-44 text-center">JUMLAH PESERTA</th>
                <th className="py-3 px-4 border-r border-slate-300 min-w-[240px]">ESTIMASI TANGGAL</th>
                <th className="py-3 px-4 border-r border-slate-300 min-w-[240px]">ACTUAL DATE</th>
                <th className="py-3 px-4 text-center w-24">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAgendas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                      <span>Belum ada agenda penjadwalan. Silakan klik tombol <strong>+ Tambah Agenda</strong>.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAgendas.map((item, idx) => {
                  const isUpcoming = item.status === 'Direncanakan' || (item.kuota_total === 0 && idx >= 2);
                  const rowBg = isUpcoming
                    ? 'bg-rose-50/60 hover:bg-rose-50'
                    : idx % 2 === 0
                    ? 'bg-white hover:bg-slate-50/80'
                    : 'bg-[#fafbfc] hover:bg-slate-50/80';

                  return (
                    <tr key={item.id} className={`${rowBg} transition-colors border-b border-slate-200`}>
                      {/* Cabang */}
                      <td className="py-3.5 px-4 border-r border-slate-200 font-black text-center text-slate-800 text-sm">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-[#0c2e59] border border-slate-200 font-black">
                          {item.cabang}
                        </span>
                      </td>

                      {/* Batch */}
                      <td className="py-3.5 px-4 border-r border-slate-200">
                        <div className="font-extrabold text-[#0c2e59] text-[13px] tracking-tight">
                          {item.batch}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                          {item.program || 'Program Intensif'}
                        </div>
                      </td>

                      {/* Kapasitas Kelas */}
                      <td className="py-3.5 px-4 border-r border-slate-200 text-center font-bold">
                        <div className="text-slate-700">
                          P = {item.kapasitas_p}
                          {item.kapasitas_l > 0 ? `, L = ${item.kapasitas_l}` : ''}
                        </div>
                        <div className="text-[11px] font-black text-slate-900 mt-1 uppercase tracking-tight">
                          TOTAL: {item.kapasitas_total}
                        </div>
                      </td>

                      {/* Jumlah Peserta / Kuota */}
                      <td className="py-3.5 px-4 border-r border-slate-200 text-center font-bold">
                        <div className="text-slate-700">
                          {item.kuota_keterangan || `P = ${item.kuota_p}`}
                        </div>
                        <div className="text-[11px] font-black text-slate-900 mt-1 uppercase tracking-tight">
                          TOTAL: {item.kuota_total}
                        </div>
                      </td>

                      {/* Estimasi Tanggal */}
                      <td className="py-3.5 px-4 border-r border-slate-200">
                        <div className="space-y-1 font-medium">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-slate-600 font-semibold">Pra Pendidikan</span>
                            <span className="font-bold text-slate-900">{formatDate(item.est_pra_pendidikan)}</span>
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-slate-600 font-semibold">Kedatangan ke Asrama</span>
                            <span className="font-bold text-slate-900">{formatDate(item.est_kedatangan_asrama)}</span>
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-blue-700 font-black uppercase text-[11px]">MULAI (OFFLINE)</span>
                            <span className="font-black text-blue-900">{formatDate(item.est_mulai_offline)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Actual Date */}
                      <td className="py-3.5 px-4 border-r border-slate-200">
                        <div className="space-y-1 font-medium">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-slate-600 font-semibold">Pra Pendidikan</span>
                            <span className="font-bold text-slate-900">{formatDate(item.act_pra_pendidikan)}</span>
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-slate-600 font-semibold">Kedatangan ke Asrama</span>
                            <span className="font-bold text-slate-900">{formatDate(item.act_kedatangan_asrama)}</span>
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-emerald-700 font-black uppercase text-[11px]">MULAI (OFFLINE)</span>
                            <span className="font-black text-emerald-900">{formatDate(item.act_mulai_offline)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            title="Edit Agenda"
                            className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.batch)}
                            title="Hapus Agenda"
                            className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* MODAL FORM: TAMBAH / EDIT AGENDA PENDIDIKAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full cursor-pointer hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  {isEditing ? 'Edit Jadwal Agenda Pendidikan' : 'Tambah Agenda Pendidikan Baru'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Rencana Penjadwalan Program Intensif LPK Creativa
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-3.5">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Informasi Batch &amp; Program
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cabang <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: CJR"
                      value={formData.cabang}
                      onChange={(e) => handleInputChange('cabang', e.target.value.toUpperCase())}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Batch <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: BATCH 1/A (JUNE 2026)"
                      value={formData.batch}
                      onChange={(e) => handleInputChange('batch', e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Program</label>
                    <input
                      type="text"
                      placeholder="Program Intensif"
                      value={formData.program}
                      onChange={(e) => handleInputChange('program', e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tahun</label>
                    <input
                      type="number"
                      placeholder="2026"
                      value={formData.tahun}
                      onChange={(e) => handleInputChange('tahun', parseInt(e.target.value, 10) || 2026)}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-3.5">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Kapasitas Kelas &amp; Jumlah Peserta (Kuota)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kapasitas (P)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.kapasitas_p}
                      onChange={(e) => handleInputChange('kapasitas_p', e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kapasitas (L)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.kapasitas_l}
                      onChange={(e) => handleInputChange('kapasitas_l', e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Kapasitas</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.kapasitas_total}
                      onChange={(e) => handleInputChange('kapasitas_total', e.target.value)}
                      className={`${fieldClass} bg-slate-100 font-bold`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kuota Peserta (P)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.kuota_p}
                      onChange={(e) => handleInputChange('kuota_p', e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kuota Peserta (L)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.kuota_l}
                      onChange={(e) => handleInputChange('kuota_l', e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Kuota Peserta</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.kuota_total}
                      onChange={(e) => handleInputChange('kuota_total', e.target.value)}
                      className={`${fieldClass} bg-slate-100 font-bold`}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Keterangan Detail Kuota (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: P = 16 (14) (2)"
                      value={formData.kuota_keterangan}
                      onChange={(e) => handleInputChange('kuota_keterangan', e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-3.5">
                <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  3. Estimasi Tanggal (Rencana)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pra Pendidikan</label>
                    <input
                      type="date"
                      value={formData.est_pra_pendidikan}
                      onChange={(e) => handleInputChange('est_pra_pendidikan', e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kedatangan ke Asrama</label>
                    <input
                      type="date"
                      value={formData.est_kedatangan_asrama}
                      onChange={(e) => handleInputChange('est_kedatangan_asrama', e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mulai (Offline)</label>
                    <input
                      type="date"
                      value={formData.est_mulai_offline}
                      onChange={(e) => handleInputChange('est_mulai_offline', e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-3.5">
                <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  4. Actual Date (Tanggal Realisasi)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pra Pendidikan</label>
                    <input
                      type="date"
                      value={formData.act_pra_pendidikan}
                      onChange={(e) => handleInputChange('act_pra_pendidikan', e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kedatangan ke Asrama</label>
                    <input
                      type="date"
                      value={formData.act_kedatangan_asrama}
                      onChange={(e) => handleInputChange('act_kedatangan_asrama', e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mulai (Offline)</label>
                    <input
                      type="date"
                      value={formData.act_mulai_offline}
                      onChange={(e) => handleInputChange('act_mulai_offline', e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className={fieldClass}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Direncanakan">Direncanakan</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                  <input
                    type="text"
                    placeholder="Opsional"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0c2e59] to-[#1a56db] hover:from-[#0a2547] hover:to-[#1648b8] text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-60 cursor-pointer flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{isEditing ? 'Simpan Perubahan' : 'Simpan Agenda'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
