import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { 
  FinancePageHeader, 
  FinanceFilterBar, 
  FinanceTable, 
  FinanceBadge, 
  formatRupiah, 
  exportToExcel 
} from "./FinancePageComponents";
import { accountingGet } from "../../utils/accountingApi";
import { ArrowUpRight, ArrowDownRight, BookOpen } from "lucide-react";

const INITIAL_BUKU_TRANSAKSI = [
  { id: 1, tanggal: "2026-10-01", tipe: "Pemasukan", deskripsi: "Pembayaran Siswa Kursus", sumberDana: "BCA", nominal: 2500000, status: "Lunas" },
  { id: 2, tanggal: "2026-10-01", tipe: "Pengeluaran", deskripsi: "Pembelian Laptop Admin", sumberDana: "BCA", nominal: 7500000, status: "Approved" },
  { id: 3, tanggal: "2026-09-29", tipe: "Pemasukan", deskripsi: "Pendaftaran Siswa Baru", sumberDana: "E-Wallet", nominal: 1500000, status: "Lunas" },
  { id: 4, tanggal: "2026-09-28", tipe: "Pengeluaran", deskripsi: "Listrik Kantor", sumberDana: "E-Wallet", nominal: 1200000, status: "Lunas" },
  { id: 5, tanggal: "2026-09-25", tipe: "Pemasukan", deskripsi: "Cicilan 1 Kursus Intensif", sumberDana: "BCA", nominal: 3000000, status: "Pending" },
  { id: 6, tanggal: "2026-09-20", tipe: "Pengeluaran", deskripsi: "Gaji Bulanan Staff", sumberDana: "BCA", nominal: 25000000, status: "Paid" },
];

export default function BukuTransaksiPage() {
  const [data, setData] = useState(INITIAL_BUKU_TRANSAKSI);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [tipe, setTipe] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    accountingGet("ledger", {})
      .then(res => {
        if (active && res.data?.rows?.length > 0) {
          const apiRows = res.data.rows.map((r, i) => ({
            id: r.ledger_id || r.id || i + 1,
            tanggal: r.transaction_date || r.date,
            tipe: r.type === "income" || r.incoming_amount > 0 ? "Pemasukan" : "Pengeluaran",
            deskripsi: r.description || r.party_name || "Transaksi",
            sumberDana: r.cash_account_name || "Kas/Bank",
            nominal: Number(r.incoming_amount || r.outgoing_amount || r.amount || 0),
            status: r.payment_status === "paid" || r.approval_status === "approved" ? "Lunas" : "Pending",
          }));
          setData(apiRows);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const filteredData = data.filter(item => {
    if (tipe !== "all" && item.tipe.toLowerCase() !== tipe.toLowerCase()) return false;
    if (status !== "all" && item.status.toLowerCase() !== status.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.deskripsi.toLowerCase().includes(q) ||
        item.sumberDana.toLowerCase().includes(q) ||
        item.tipe.toLowerCase().includes(q)
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
        Tipe: d.tipe,
        Deskripsi: d.deskripsi,
        "Sumber Dana": d.sumberDana,
        Nominal: d.nominal,
        Status: d.status,
      })),
      "Buku_Transaksi"
    );
  };

  const columns = [
    { header: "No", accessor: "no", align: "center", className: "w-12 text-slate-400 font-medium", render: (_, i) => (page - 1) * perPage + i + 1 },
    { header: "Tanggal", accessor: "tanggal", className: "whitespace-nowrap font-medium" },
    { 
      header: "Tipe", 
      accessor: "tipe", 
      align: "center",
      render: (r) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
          r.tipe === "Pemasukan" 
            ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
            : "bg-rose-50 text-rose-600 border border-rose-100"
        }`}>
          {r.tipe === "Pemasukan" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {r.tipe}
        </span>
      )
    },
    { header: "Deskripsi", accessor: "deskripsi", className: "font-semibold text-slate-800" },
    { header: "Sumber Dana", accessor: "sumberDana" },
    { 
      header: "Nominal", 
      accessor: "nominal", 
      align: "right", 
      className: "font-bold",
      render: (r) => (
        <span className={r.tipe === "Pemasukan" ? "text-emerald-600" : "text-rose-600"}>
          {r.tipe === "Pemasukan" ? "+" : "-"}{formatRupiah(r.nominal)}
        </span>
      )
    },
  ];

  return (
    <Layout>
      <div className="p-4 md:p-7 max-w-7xl mx-auto">
        <FinancePageHeader
          title="Buku Transaksi"
          subtitle="Daftar pembukuan arus transaksi kas masuk dan keluar secara kronologis"
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
          searchPlaceholder="Cari transaksi / pihak..."
          dropdowns={[
            {
              value: tipe,
              onChange: setTipe,
              options: [
                { value: "all", label: "Semua Tipe" },
                { value: "Pemasukan", label: "Pemasukan (Masuk)" },
                { value: "Pengeluaran", label: "Pengeluaran (Keluar)" },
              ],
            },
            {
              value: status,
              onChange: setStatus,
              options: [
                { value: "all", label: "Semua Status" },
                { value: "Lunas", label: "Lunas / Approved" },
                { value: "Pending", label: "Pending" },
              ],
            },
          ]}
          onReset={() => {
            setTipe("all");
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
      </div>
    </Layout>
  );
}
