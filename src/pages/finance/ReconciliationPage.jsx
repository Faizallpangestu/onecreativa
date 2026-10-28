import React, { useState } from "react";
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
import { Landmark, CheckCircle, Scale, Upload, Check } from "lucide-react";

const INITIAL_RECONCILIATION = [
  { id: 1, tanggal: "01/10/2026", deskripsi: "Pembayaran Siswa (Andi Saputra)", mutasiBank: 2500000, mutasiSistem: 2500000, status: "Match" },
  { id: 2, tanggal: "01/10/2026", deskripsi: "Pembelian Laptop Admin", mutasiBank: -7500000, mutasiSistem: -7500000, status: "Match" },
  { id: 3, tanggal: "28/09/2026", deskripsi: "Pendaftaran Siswa (Siti Aminah)", mutasiBank: 1500000, mutasiSistem: 1500000, status: "Match" },
  { id: 4, tanggal: "25/09/2026", deskripsi: "Cicilan 1 Kursus (Budi Santoso)", mutasiBank: 3000000, mutasiSistem: 3000000, status: "Match" },
  { id: 5, tanggal: "20/09/2026", deskripsi: "Gaji Karyawan September", mutasiBank: -25000000, mutasiSistem: -25000000, status: "Match" },
];

export default function ReconciliationPage() {
  const [data, setData] = useState(INITIAL_RECONCILIATION);
  const [selectedBank, setSelectedBank] = useState("BCA");
  const [startDate, setStartDate] = useState("2026-10-01");
  const [endDate, setEndDate] = useState("2026-10-31");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadNotice, setUploadNotice] = useState("");

  const saldoSistem = 120000000;
  const saldoBank = 120000000;
  const selisih = Math.abs(saldoSistem - saldoBank);

  const filteredData = data.filter(item => {
    if (search) {
      return item.deskripsi.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const handleExport = () => {
    exportToExcel(
      filteredData.map(d => ({
        Tanggal: d.tanggal,
        Deskripsi: d.deskripsi,
        "Mutasi Bank": d.mutasiBank,
        "Mutasi Sistem": d.mutasiSistem,
        Status: d.status,
      })),
      "Rekonsiliasi_Bank"
    );
  };

  const handleImportStatement = (e) => {
    e.preventDefault();
    setUploadNotice("Rekening koran berhasil diunggah & saldo cocok 100%!");
    setTimeout(() => {
      setUploadNotice("");
      setIsModalOpen(false);
    }, 1500);
  };

  const columns = [
    { header: "Tanggal", accessor: "tanggal", className: "whitespace-nowrap font-medium w-28" },
    { header: "Deskripsi", accessor: "deskripsi", className: "font-semibold text-slate-800" },
    { 
      header: "Mutasi Bank", 
      accessor: "mutasiBank", 
      align: "right",
      className: "font-mono font-medium",
      render: (r) => (
        <span className={r.mutasiBank > 0 ? "text-emerald-600" : "text-slate-800"}>
          {formatRupiah(r.mutasiBank)}
        </span>
      )
    },
    { 
      header: "Mutasi Sistem", 
      accessor: "mutasiSistem", 
      align: "right",
      className: "font-mono font-medium",
      render: (r) => (
        <span className={r.mutasiSistem > 0 ? "text-emerald-600" : "text-slate-800"}>
          {formatRupiah(r.mutasiSistem)}
        </span>
      )
    },
    { 
      header: "Status", 
      accessor: "status", 
      align: "center",
      render: (r) => <FinanceBadge status={r.status} text="Match (Cocok)" /> 
    },
  ];

  return (
    <Layout>
      <div className="p-4 md:p-7 max-w-7xl mx-auto">
        <FinancePageHeader
          title="Reconciliation"
          subtitle="Pencocokan saldo pembukuan sistem internal dengan mutasi rekening koran bank"
          primaryLabel="Import Bank Statement"
          primaryIcon={Upload}
          onPrimaryClick={() => setIsModalOpen(true)}
          secondaryLabel="Export Excel"
          onSecondaryClick={handleExport}
        />

        {/* 3 Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <FinanceKpiCard
            title="Saldo Sistem"
            value={formatRupiah(saldoSistem)}
            subtitle="Tercatat di pembukuan"
            icon={Landmark}
            color="blue"
          />
          <FinanceKpiCard
            title="Saldo Bank"
            value={formatRupiah(saldoBank)}
            subtitle="Rekening koran bank"
            icon={CheckCircle}
            color="emerald"
          />
          <FinanceKpiCard
            title="Selisih Rekonsiliasi"
            value={formatRupiah(selisih)}
            subtitle="Status verifikasi saldo"
            badge="Cocok"
            isPositive={true}
            icon={Scale}
            color="purple"
          />
        </div>

        <FinanceFilterBar
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari transaksi rekonsiliasi..."
          dropdowns={[
            {
              value: selectedBank,
              onChange: setSelectedBank,
              options: [
                { value: "BCA", label: "Bank BCA - 1102 (Operasional)" },
                { value: "Mandiri", label: "Bank Mandiri - 1104" },
                { value: "PettyCash", label: "E-Wallet Petty Cash - 1103" },
              ],
            },
          ]}
          onReset={() => {
            setSelectedBank("BCA");
            setSearch("");
            setStartDate("2026-10-01");
            setEndDate("2026-10-31");
          }}
        />

        <FinanceTable
          columns={columns}
          data={filteredData}
          page={1}
          totalPages={1}
          totalItems={filteredData.length}
        />

        {/* Modal Import Bank Statement */}
        <FinanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Import Rekening Koran Bank"
          subtitle="Unggah file mutasi rekening (.CSV / .OFX / .XLSX)"
          onSubmit={handleImportStatement}
          submitText="Proses Rekonsiliasi"
        >
          <div className="space-y-4">
            {uploadNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{uploadNotice}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Rekening Bank</label>
              <select
                value={selectedBank}
                onChange={e => setSelectedBank(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="BCA">Bank BCA - 1102 (Operasional)</option>
                <option value="Mandiri">Bank Mandiri - 1104</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Upload File Mutasi (.CSV / .XLSX)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-400 transition cursor-pointer bg-slate-50/50">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Pilih file rekening koran atau seret ke sini</p>
                <p className="text-[11px] text-slate-400 mt-1">Mendukung format CSV, Excel, dan e-Statement PDF</p>
                <input type="file" className="hidden" id="statement-upload" />
              </div>
            </div>
          </div>
        </FinanceModal>
      </div>
    </Layout>
  );
}
