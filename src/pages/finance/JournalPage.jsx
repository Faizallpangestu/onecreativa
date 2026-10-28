import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { 
  FinancePageHeader, 
  FinanceFilterBar, 
  FinanceTable, 
  FinanceBadge, 
  FinanceModal, 
  formatRupiah, 
  exportToExcel 
} from "./FinancePageComponents";
import { accountingGet, accountingMutate } from "../../utils/accountingApi";
import { Plus } from "lucide-react";

const INITIAL_JOURNALS = [
  { id: 1, tanggal: "2026-10-01", deskripsi: "Pembayaran Siswa", referensi: "INV-00001", totalDebit: 2500000, totalKredit: 2500000, status: "Posted" },
  { id: 2, tanggal: "2026-10-01", deskripsi: "Pembelian Laptop", referensi: "EXP-0001", totalDebit: 7500000, totalKredit: 7500000, status: "Draft" },
  { id: 3, tanggal: "2026-09-28", deskripsi: "Pendaftaran Siswa", referensi: "INV-00002", totalDebit: 1500000, totalKredit: 1500000, status: "Posted" },
  { id: 4, tanggal: "2026-09-25", deskripsi: "Tagihan Listrik", referensi: "BILL-0001", totalDebit: 1200000, totalKredit: 1200000, status: "Posted" },
  { id: 5, tanggal: "2026-09-20", deskripsi: "Gaji Karyawan September", referensi: "PAYROLL-09", totalDebit: 25000000, totalKredit: 25000000, status: "Posted" },
];

export default function JournalPage() {
  const [data, setData] = useState(INITIAL_JOURNALS);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    deskripsi: "",
    referensi: "",
    nominal: "",
    status: "Posted",
  });

  const filteredData = data.filter(item => {
    if (status !== "all" && item.status.toLowerCase() !== status.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.deskripsi.toLowerCase().includes(q) ||
        item.referensi.toLowerCase().includes(q)
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
        Tanggal: d.tanggal,
        Deskripsi: d.deskripsi,
        Referensi: d.referensi,
        "Total Debit": d.totalDebit,
        "Total Kredit": d.totalKredit,
        Status: d.status,
      })),
      "Journal_Akuntansi"
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.deskripsi || !form.nominal) return;
    setBusy(true);
    const nominal = Number(form.nominal);
    const newJournal = {
      id: Date.now(),
      tanggal: form.tanggal,
      deskripsi: form.deskripsi,
      referensi: form.referensi || `JRN-${Date.now().toString().slice(-4)}`,
      totalDebit: nominal,
      totalKredit: nominal,
      status: form.status,
    };
    setData([newJournal, ...data]);
    setBusy(false);
    setIsModalOpen(false);
    setForm({
      tanggal: new Date().toISOString().slice(0, 10),
      deskripsi: "",
      referensi: "",
      nominal: "",
      status: "Posted",
    });
  };

  const columns = [
    { header: "No", accessor: "no", align: "center", className: "w-12 text-slate-400 font-medium", render: (_, i) => (page - 1) * perPage + i + 1 },
    { header: "Tanggal", accessor: "tanggal", className: "whitespace-nowrap font-medium" },
    { header: "Deskripsi", accessor: "deskripsi", className: "font-semibold text-slate-900" },
    { header: "Referensi", accessor: "referensi", className: "font-mono font-medium text-slate-600" },
    { header: "Total Debit", accessor: "totalDebit", align: "right", className: "font-bold text-slate-900", render: (r) => formatRupiah(r.totalDebit) },
    { header: "Total Kredit", accessor: "totalKredit", align: "right", className: "font-bold text-slate-900", render: (r) => formatRupiah(r.totalKredit) },
    { header: "Status", accessor: "status", align: "center", render: (r) => <FinanceBadge status={r.status} /> },
  ];

  return (
    <Layout>
      <div className="p-4 md:p-7 max-w-7xl mx-auto">
        <FinancePageHeader
          title="Journal Akuntansi"
          subtitle="Daftar entri jurnal debit dan kredit otomatis dari seluruh transaksi"
          primaryLabel="+ Buat Journal"
          onPrimaryClick={() => setIsModalOpen(true)}
          onSecondaryClick={handleExport}
        />

        <FinanceFilterBar
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari deskripsi atau no referensi..."
          dropdowns={[
            {
              value: status,
              onChange: setStatus,
              options: [
                { value: "all", label: "Semua Status" },
                { value: "Posted", label: "Posted" },
                { value: "Draft", label: "Draft" },
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

        {/* Modal Buat Journal */}
        <FinanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Buat Jurnal Manual"
          subtitle="Entri jurnal nonkas atau penyesuaian seimbang"
          onSubmit={handleSave}
          submitText="Simpan Jurnal"
          busy={busy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={form.tanggal}
                onChange={e => setForm({ ...form, tanggal: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Referensi</label>
              <input
                type="text"
                placeholder="JRN-2026-001"
                value={form.referensi}
                onChange={e => setForm({ ...form, referensi: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Transaksi</label>
              <input
                type="text"
                required
                placeholder="Contoh: Penyesuaian Penyusutan atau Jurnal Pembayaran"
                value={form.deskripsi}
                onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal Seimbang (Debit/Kredit)</label>
              <input
                type="number"
                required
                placeholder="0"
                value={form.nominal}
                onChange={e => setForm({ ...form, nominal: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Entri</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Posted">Posted (Final)</option>
                <option value="Draft">Draft (Review)</option>
              </select>
            </div>
          </div>
        </FinanceModal>
      </div>
    </Layout>
  );
}
