import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { 
  FinancePageHeader, 
  FinanceKpiCard, 
  FinanceFilterBar, 
  FinanceTable, 
  FinanceBadge, 
  FinanceModal, 
  formatRupiah, 
  exportToExcel 
} from "./FinancePageComponents";
import { FileText, Clock, CheckCircle2, AlertTriangle, Eye, Plus } from "lucide-react";

const INITIAL_BILLS = [
  { id: "BILL-0001", tanggal: "2026-10-01", jatuhTempo: "2026-10-15", vendor: "CV Sukses Listrik", total: 1800000, status: "Belum Dibayar", deskripsi: "Instalasi dan perbaikan panel listrik kantor" },
  { id: "BILL-0002", tanggal: "2026-09-28", jatuhTempo: "2026-10-05", vendor: "PT Maju Internet", total: 700000, status: "Lunas", deskripsi: "Tagihan koneksi internet fiber bulan September" },
  { id: "BILL-0003", tanggal: "2026-09-20", jatuhTempo: "2026-09-30", vendor: "PT Office Equipment", total: 2500000, status: "Jatuh Tempo", deskripsi: "Sewa mesin fotokopi dan supplies printer" },
  { id: "BILL-0004", tanggal: "2026-09-15", jatuhTempo: "2026-10-15", vendor: "Percetakan Mitra", total: 4500000, status: "Lunas", deskripsi: "Cetak modul diktat bahasa Jepang N4" },
  { id: "BILL-0005", tanggal: "2026-09-10", jatuhTempo: "2026-09-25", vendor: "Toko ATK Sentosa", total: 1200000, status: "Lunas", deskripsi: "Pengadaan kertas A4, spidol, dan alat tulis" },
];

export default function BillsPage() {
  const [data, setData] = useState(INITIAL_BILLS);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    id: `BILL-000${data.length + 1}`,
    tanggal: new Date().toISOString().slice(0, 10),
    jatuhTempo: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    vendor: "CV Sukses Listrik",
    total: "",
    status: "Belum Dibayar",
    deskripsi: "",
  });

  const totalTagihan = data.reduce((s, r) => s + r.total, 0);
  const belumDibayar = data.filter(r => r.status === "Belum Dibayar").reduce((s, r) => s + r.total, 0);
  const lunas = data.filter(r => r.status === "Lunas").reduce((s, r) => s + r.total, 0);
  const jatuhTempo = data.filter(r => r.status === "Jatuh Tempo").reduce((s, r) => s + r.total, 0);

  const filteredData = data.filter(item => {
    if (status !== "all" && item.status.toLowerCase() !== status.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.vendor.toLowerCase().includes(q) ||
        (item.deskripsi && item.deskripsi.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const perPage = 10;
  const totalPages = Math.ceil(filteredData.length / perPage) || 1;
  const paginatedData = filteredData.slice((page - 1) * perPage, page * perPage);

  const handleExport = () => {
    exportToExcel(
      filteredData.map(d => ({
        "No. Bill": d.id,
        Tanggal: d.tanggal,
        "Jatuh Tempo": d.jatuhTempo,
        Vendor: d.vendor,
        Total: d.total,
        Status: d.status,
        Keterangan: d.deskripsi,
      })),
      "Bills_Tagihan_Vendor"
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.vendor || !form.total) return;
    setBusy(true);
    const newBill = {
      id: form.id || `BILL-000${data.length + 1}`,
      tanggal: form.tanggal,
      jatuhTempo: form.jatuhTempo,
      vendor: form.vendor,
      total: Number(form.total),
      status: form.status,
      deskripsi: form.deskripsi,
    };
    setData([newBill, ...data]);
    setBusy(false);
    setIsModalOpen(false);
    setForm({
      id: `BILL-000${data.length + 2}`,
      tanggal: new Date().toISOString().slice(0, 10),
      jatuhTempo: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      vendor: "CV Sukses Listrik",
      total: "",
      status: "Belum Dibayar",
      deskripsi: "",
    });
  };

  const columns = [
    { header: "No. Bill", accessor: "id", className: "font-mono font-bold text-slate-800" },
    { header: "Tanggal", accessor: "tanggal", className: "whitespace-nowrap font-medium" },
    { header: "Vendor", accessor: "vendor", className: "font-semibold text-slate-900" },
    { header: "Total Tagihan", accessor: "total", align: "right", className: "font-bold text-slate-900", render: (r) => formatRupiah(r.total) },
    { header: "Status", accessor: "status", align: "center", render: (r) => <FinanceBadge status={r.status} /> },
    { 
      header: "Aksi", 
      accessor: "aksi", 
      align: "center",
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelectedItem(r)}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          title="Lihat Detail Bill"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    },
  ];

  return (
    <Layout>
      <div className="p-4 md:p-7 max-w-7xl mx-auto">
        <FinancePageHeader
          title="Bills (Tagihan)"
          subtitle="Kelola tagihan masuk dan kewajiban pembayaran operasional vendor"
          primaryLabel="+ Buat Tagihan"
          onPrimaryClick={() => setIsModalOpen(true)}
          onSecondaryClick={handleExport}
        />

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <FinanceKpiCard
            title="Total Tagihan"
            value={formatRupiah(totalTagihan)}
            subtitle="Kewajiban berjalan"
            icon={FileText}
            color="blue"
          />
          <FinanceKpiCard
            title="Belum Dibayar"
            value={formatRupiah(belumDibayar)}
            subtitle="Menunggu proses transfer"
            icon={Clock}
            color="amber"
          />
          <FinanceKpiCard
            title="Lunas"
            value={formatRupiah(lunas)}
            subtitle="Sudah diverifikasi terbayar"
            icon={CheckCircle2}
            color="emerald"
          />
          <FinanceKpiCard
            title="Jatuh Tempo"
            value={formatRupiah(jatuhTempo)}
            subtitle="Melewati batas tempo"
            icon={AlertTriangle}
            color="rose"
          />
        </div>

        <FinanceFilterBar
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari no. bill / vendor..."
          dropdowns={[
            {
              value: status,
              onChange: setStatus,
              options: [
                { value: "all", label: "Semua Status" },
                { value: "Belum Dibayar", label: "Belum Dibayar" },
                { value: "Lunas", label: "Lunas" },
                { value: "Jatuh Tempo", label: "Jatuh Tempo" },
              ],
            },
          ]}
          onReset={() => {
            setStatus("all");
            setSearch("");
            setStartDate("2026-01-01");
            setEndDate("2026-12-31");
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

        {/* Modal Buat Tagihan */}
        <FinanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Buat Tagihan Vendor Baru"
          subtitle="Catat invoice masuk dari supplier atau vendor rekanan"
          onSubmit={handleSave}
          submitText="Simpan Tagihan"
          busy={busy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Tagihan / Bill</label>
              <input
                type="text"
                required
                value={form.id}
                onChange={e => setForm({ ...form, id: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Vendor</label>
              <input
                type="text"
                required
                placeholder="Contoh: CV Sukses Listrik"
                value={form.vendor}
                onChange={e => setForm({ ...form, vendor: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Tagihan</label>
              <input
                type="date"
                required
                value={form.tanggal}
                onChange={e => setForm({ ...form, tanggal: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                required
                value={form.jatuhTempo}
                onChange={e => setForm({ ...form, jatuhTempo: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Nominal Tagihan (Rp)</label>
              <input
                type="number"
                required
                placeholder="0"
                value={form.total}
                onChange={e => setForm({ ...form, total: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Pembayaran</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Belum Dibayar">Belum Dibayar</option>
                <option value="Lunas">Lunas</option>
                <option value="Jatuh Tempo">Jatuh Tempo</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Keterangan / Rincian Pekerjaan</label>
              <textarea
                rows={2}
                placeholder="Deskripsi layanan atau barang dari vendor..."
                value={form.deskripsi}
                onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </FinanceModal>

        {/* Modal Detail Bill */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-base font-bold text-slate-900 mb-1">Detail Tagihan Vendor</h3>
              <p className="text-xs text-slate-400 mb-4">{selectedItem.id} · {selectedItem.vendor}</p>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Tanggal Tagihan:</span><span className="font-semibold text-slate-800">{selectedItem.tanggal}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Jatuh Tempo:</span><span className="font-semibold text-slate-800">{selectedItem.jatuhTempo}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Nama Vendor:</span><span className="font-semibold text-slate-800">{selectedItem.vendor}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total Tagihan:</span><span className="font-bold text-slate-900 text-sm">{formatRupiah(selectedItem.total)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status:</span><FinanceBadge status={selectedItem.status} /></div>
                {selectedItem.deskripsi && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-slate-500 block mb-0.5">Rincian:</span>
                    <p className="text-slate-700 italic">{selectedItem.deskripsi}</p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end">
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
