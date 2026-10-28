import React, { useState } from "react";
import Layout from "../../components/Layout";
import { 
  FinancePageHeader, 
  FinanceFilterBar, 
  FinanceTable, 
  formatRupiah, 
  exportToExcel 
} from "./FinancePageComponents";
import { Landmark } from "lucide-react";

const INITIAL_LEDGER_ROWS = [
  { id: 1, tanggal: "01/10/2026", deskripsi: "Saldo Awal Bulan", debit: 0, kredit: 0, saldo: 120000000 },
  { id: 2, tanggal: "01/10/2026", deskripsi: "Pembayaran Siswa (Andi Saputra)", debit: 2500000, kredit: 0, saldo: 122500000 },
  { id: 3, tanggal: "01/10/2026", deskripsi: "Pembelian Laptop Admin (CV Sukses)", debit: 0, kredit: 7500000, saldo: 115000000 },
  { id: 4, tanggal: "28/09/2026", deskripsi: "Pendaftaran Siswa (Siti Aminah)", debit: 1500000, kredit: 0, saldo: 116500000 },
  { id: 5, tanggal: "25/09/2026", deskripsi: "Cicilan 1 Kursus (Budi Santoso)", debit: 3000000, kredit: 0, saldo: 119500000 },
  { id: 6, tanggal: "20/09/2026", deskripsi: "Gaji Bulanan Karyawan", debit: 0, kredit: 25000000, saldo: 94500000 },
];

export default function GeneralLedgerPage() {
  const [data, setData] = useState(INITIAL_LEDGER_ROWS);
  const [selectedAccount, setSelectedAccount] = useState("1102");
  const [startDate, setStartDate] = useState("2026-10-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [search, setSearch] = useState("");

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
        Debit: d.debit,
        Kredit: d.kredit,
        Saldo: d.saldo,
      })),
      "General_Ledger_Buku_Besar"
    );
  };

  const columns = [
    { header: "Tanggal", accessor: "tanggal", className: "whitespace-nowrap font-medium w-28" },
    { header: "Deskripsi Transaksi", accessor: "deskripsi", className: "font-semibold text-slate-800" },
    { 
      header: "Debit (Masuk)", 
      accessor: "debit", 
      align: "right",
      className: "font-mono font-medium text-emerald-600",
      render: (r) => r.debit > 0 ? formatRupiah(r.debit) : "—" 
    },
    { 
      header: "Kredit (Keluar)", 
      accessor: "kredit", 
      align: "right",
      className: "font-mono font-medium text-rose-600",
      render: (r) => r.kredit > 0 ? formatRupiah(r.kredit) : "—" 
    },
    { 
      header: "Saldo Berjalan", 
      accessor: "saldo", 
      align: "right", 
      className: "font-mono font-bold text-slate-900",
      render: (r) => formatRupiah(r.saldo) 
    },
  ];

  return (
    <Layout>
      <div className="p-4 md:p-7 max-w-7xl mx-auto">
        <FinancePageHeader
          title="General Ledger (Buku Besar)"
          subtitle="Rincian mutasi debit, kredit, dan saldo berjalan per akun akuntansi"
          secondaryLabel="Export Excel"
          onSecondaryClick={handleExport}
        />

        <FinanceFilterBar
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari mutasi transaksi..."
          dropdowns={[
            {
              value: selectedAccount,
              onChange: setSelectedAccount,
              options: [
                { value: "1102", label: "Bank BCA (1102)" },
                { value: "1101", label: "Kas Tunai (1101)" },
                { value: "1103", label: "E-Wallet Petty Cash (1103)" },
                { value: "1201", label: "Piutang Siswa (1201)" },
                { value: "4001", label: "Pendapatan Kursus (4001)" },
                { value: "5001", label: "Beban Gaji (5001)" },
              ],
            },
          ]}
          onReset={() => {
            setSelectedAccount("1102");
            setSearch("");
            setStartDate("2026-10-01");
            setEndDate("2026-12-31");
          }}
        />

        <FinanceTable
          columns={columns}
          data={filteredData}
          page={1}
          totalPages={1}
          totalItems={filteredData.length}
        />
      </div>
    </Layout>
  );
}
