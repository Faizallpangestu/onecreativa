import React, { useState } from 'react';
import {
  FinancePageHeader,
  FinanceKpiCard,
  FinanceFilterBar,
  FinanceBadge,
  FinanceTable,
  formatRupiah,
  exportToExcel,
} from './FinancePageComponents';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function CashflowPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('2026');

  // KPI Metrics matching Mockup #14
  const kpiData = [
    {
      title: 'Saldo Awal',
      value: formatRupiah(100000000),
      subtitle: 'Periode Berjalan',
      icon: Wallet,
      color: 'blue',
    },
    {
      title: 'Total Pemasukan',
      value: formatRupiah(245000000),
      subtitle: '+18.5% dari bulan lalu',
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      title: 'Total Pengeluaran',
      value: formatRupiah(180000000),
      subtitle: '8 transaksi operasional',
      icon: TrendingDown,
      color: 'rose',
    },
    {
      title: 'Saldo Akhir',
      value: formatRupiah(165000000),
      subtitle: 'Net Arus Kas Positif',
      icon: DollarSign,
      color: 'violet',
    },
  ];

  // Monthly Cash Flow Chart Data
  const monthlyData = [
    { bulan: 'Jan', pemasukan: 180, pengeluaran: 120, saldo: 60 },
    { bulan: 'Feb', pemasukan: 210, pengeluaran: 140, saldo: 70 },
    { bulan: 'Mar', pemasukan: 195, pengeluaran: 135, saldo: 60 },
    { bulan: 'Apr', pemasukan: 220, pengeluaran: 160, saldo: 60 },
    { bulan: 'Mei', pemasukan: 230, pengeluaran: 155, saldo: 75 },
    { bulan: 'Jun', pemasukan: 245, pengeluaran: 180, saldo: 65 },
  ];

  // Cashflow breakdown activities
  const [activities] = useState([
    {
      id: 1,
      kategori: 'Aktivitas Operasional',
      keterangan: 'Penerimaan SPP & Biaya Kursus Siswa',
      tipe: 'inflow',
      nominal: 215000000,
      tanggal: '2026-06-25',
    },
    {
      id: 2,
      kategori: 'Aktivitas Operasional',
      keterangan: 'Pembayaran Gaji Instruktur & Karyawan',
      tipe: 'outflow',
      nominal: 85000000,
      tanggal: '2026-06-24',
    },
    {
      id: 3,
      kategori: 'Aktivitas Operasional',
      keterangan: 'Beban Sewa Gedung & Listrik/Air',
      tipe: 'outflow',
      nominal: 35000000,
      tanggal: '2026-06-22',
    },
    {
      id: 4,
      kategori: 'Aktivitas Investasi',
      keterangan: 'Pembelian 10 Unit Laptop Kursus Baru',
      tipe: 'outflow',
      nominal: 60000000,
      tanggal: '2026-06-18',
    },
    {
      id: 5,
      kategori: 'Aktivitas Pendanaan',
      keterangan: 'Penerimaan Kerjasama Mitra Korporat',
      tipe: 'inflow',
      nominal: 30000000,
      tanggal: '2026-06-15',
    },
  ]);

  const handleExport = () => {
    const exportRows = activities.map((item, idx) => ({
      No: idx + 1,
      Tanggal: item.tanggal,
      Kategori: item.kategori,
      Keterangan: item.keterangan,
      Tipe: item.tipe === 'inflow' ? 'Arus Masuk' : 'Arus Keluar',
      Nominal: item.nominal,
    }));
    exportToExcel(exportRows, 'Laporan_Cashflow');
  };

  const tableColumns = [
    {
      key: 'tanggal',
      header: 'Tanggal',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700">{row.tanggal}</span>
      ),
    },
    {
      key: 'kategori',
      header: 'Kategori Aktivitas',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-900">{row.kategori}</span>
      ),
    },
    {
      key: 'keterangan',
      header: 'Keterangan',
      render: (row) => (
        <span className="text-xs text-slate-600">{row.keterangan}</span>
      ),
    },
    {
      key: 'tipe',
      header: 'Arus Kas',
      render: (row) =>
        row.tipe === 'inflow' ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Masuk
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
            <ArrowUpRight className="w-3.5 h-3.5" /> Keluar
          </span>
        ),
    },
    {
      key: 'nominal',
      header: 'Nominal',
      render: (row) => (
        <span
          className={`text-xs font-bold ${
            row.tipe === 'inflow' ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {row.tipe === 'inflow' ? '+' : '-'} {formatRupiah(row.nominal)}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
      {/* Header */}
      <FinancePageHeader
        title="Laporan Cash Flow"
        subtitle="Analisis perputaran arus kas masuk dan keluar secara komprehensif"
        onExport={handleExport}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {kpiData.map((kpi, idx) => (
          <FinanceKpiCard key={idx} {...kpi} />
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Arus Kas Bulanan (Jutaan Rupiah)
            </h3>
            <p className="text-xs text-slate-500">
              Perbandingan arus kas masuk, arus kas keluar, dan saldo neto
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Tahun:
            </span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>

        <div className="h-[280px] sm:h-[320px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
                formatter={(val) => `Rp ${val} Juta`}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
              />
              <Bar dataKey="pemasukan" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saldo" name="Saldo Bersih" fill="#1a73e8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rincian Arus Kas Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-800">
          Rincian Transaksi Arus Kas Terbaru
        </h3>
        <FinanceTable
          columns={tableColumns}
          data={activities}
          totalItems={activities.length}
          emptyMessage="Tidak ada aktivitas arus kas"
        />
      </div>
    </div>
  );
}
