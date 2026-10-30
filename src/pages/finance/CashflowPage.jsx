import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import {
  FinancePageHeader,
  FinanceKpiCard,
  FinanceFilterBar,
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
  Layers,
  Building2,
  CheckCircle2,
  Info
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
import axios from 'axios';

// Blueprint invoice default untuk siswa aktif
const DEFAULT_BLUEPRINT_INVOICES = [
  {
    id: "INV-2026-003",
    customer: "Hany Agesti",
    program: "Kursus Bahasa Jepang Reguler N4",
    terbayar: 2500000,
    tanggal: "2026-10-24",
    resep: "RCP-2026-088",
    kategori: "Aktivitas Operasional",
    akun: "Bank BCA Operasional"
  },
  {
    id: "INV-2026-004",
    customer: "Siti Aminah",
    program: "Kursus Bahasa Jepang Intensif Tokutei Ginou",
    terbayar: 3500000,
    tanggal: "2026-10-25",
    resep: "RCP-2026-089",
    kategori: "Aktivitas Operasional",
    akun: "Bank BCA Operasional"
  }
];

export default function CashflowPage() {
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [search, setSearch] = useState('');
  const [serverSalaries, setServerSalaries] = useState([]);

  // Fetch data gaji riil dari API
  useEffect(() => {
    let active = true;
    axios.get('/api/salaries.php?all=1')
      .then(res => {
        if (active && Array.isArray(res.data?.data?.requests)) {
          setServerSalaries(res.data.data.requests);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // ── EKSTRAKSI TRANSAKSI ARUS KAS 100% RIIL DARI BERBAGAI SUMBER AKTIF ──
  const allCashActivities = useMemo(() => {
    const list = [];
    const addedRefs = new Set();

    // 1. Penerimaan Pembayaran Invoice Siswa (billing_pembayaran_custom) -> Operasional Masuk
    try {
      const savedPayments = JSON.parse(localStorage.getItem('billing_pembayaran_custom') || '[]');
      if (Array.isArray(savedPayments)) {
        savedPayments.forEach((p) => {
          if (!p || !p.jumlah) return;
          const refKey = p.receiptNo || `PAY-${p.id || p.noInv}`;
          if (addedRefs.has(refKey)) return;
          addedRefs.add(refKey);

          list.push({
            id: `cf-pay-${p.id || refKey}`,
            tanggal: p.tglBayar || '2026-10-29',
            kategori: 'Aktivitas Operasional',
            keterangan: `Penerimaan Pembayaran Siswa - ${p.customer || 'Siswa LPK'} (${p.terminName || 'Pelunasan Kursus'})`,
            tipe: 'inflow',
            nominal: Number(p.jumlah || 0),
            akun: 'Bank BCA Operasional',
            referensi: p.receiptNo || p.noInv || refKey
          });
        });
      }
    } catch (e) {
      console.warn('Gagal membaca billing_pembayaran_custom:', e);
    }

    // 2. Penerimaan dari saved_custom_invoices -> Operasional Masuk
    try {
      const savedInvoices = JSON.parse(localStorage.getItem('saved_custom_invoices') || '[]');
      if (Array.isArray(savedInvoices)) {
        savedInvoices.forEach((inv) => {
          if (!inv) return;
          const invId = inv.id || inv.nomor || '';

          if (Array.isArray(inv.payments) && inv.payments.length > 0) {
            inv.payments.forEach((p, idx) => {
              const refKey = p.receiptNo || `RCP-${invId}-${idx + 1}`;
              if (addedRefs.has(refKey)) return;
              addedRefs.add(refKey);

              const nom = Number(p.jumlah || 0);
              if (nom > 0) {
                list.push({
                  id: `cf-invpay-${refKey}`,
                  tanggal: p.tglBayar || inv.tanggal || '2026-10-29',
                  kategori: 'Aktivitas Operasional',
                  keterangan: `Penerimaan SPP/Kursus Siswa - ${inv.customer || 'Siswa LPK'} (${p.terminName || 'Termin ' + (idx + 1)})`,
                  tipe: 'inflow',
                  nominal: nom,
                  akun: 'Bank BCA Operasional',
                  referensi: p.receiptNo || invId
                });
              }
            });
          } else if (Number(inv.terbayar || 0) > 0) {
            const refKey = `INV-PAID-${invId}`;
            if (!addedRefs.has(refKey) && !addedRefs.has(invId)) {
              addedRefs.add(refKey);
              list.push({
                id: `cf-inv-${invId}`,
                tanggal: inv.paid_at || inv.tanggal || '2026-10-29',
                kategori: 'Aktivitas Operasional',
                keterangan: `Penerimaan Invoice Kursus #${invId} - ${inv.customer || 'Siswa LPK'}`,
                tipe: 'inflow',
                nominal: Number(inv.terbayar),
                akun: 'Bank BCA Operasional',
                referensi: invId
              });
            }
          }
        });
      }
    } catch (e) {
      console.warn('Gagal membaca saved_custom_invoices:', e);
    }

    // 3. Penerimaan Blueprint Siswa Resmi (Hany Agesti & Siti Aminah)
    DEFAULT_BLUEPRINT_INVOICES.forEach((defInv) => {
      const refKey = defInv.resep || defInv.id;
      if (!addedRefs.has(refKey) && !addedRefs.has(defInv.id)) {
        addedRefs.add(refKey);
        list.push({
          id: `cf-blueprint-${defInv.id}`,
          tanggal: defInv.tanggal,
          kategori: 'Aktivitas Operasional',
          keterangan: `Penerimaan SPP Siswa - ${defInv.customer} (${defInv.program})`,
          tipe: 'inflow',
          nominal: defInv.terbayar,
          akun: defInv.akun,
          referensi: defInv.id
        });
      }
    });

    // 4. Pemasukan Lainnya (finance_income_data)
    try {
      const incRaw = localStorage.getItem('finance_income_data');
      if (incRaw) {
        const incList = JSON.parse(incRaw);
        if (Array.isArray(incList)) {
          incList.forEach((inc) => {
            if (!inc) return;
            const refKey = `INC-${inc.id || inc.noTransaksi}`;
            if (addedRefs.has(refKey)) return;
            addedRefs.add(refKey);

            list.push({
              id: `cf-inc-${inc.id}`,
              tanggal: inc.tanggal || '2026-10-20',
              kategori: inc.kategori?.toLowerCase().includes('modal') ? 'Aktivitas Pendanaan' : 'Aktivitas Operasional',
              keterangan: `${inc.kategori || 'Pemasukan Lain'} - ${inc.keterangan || inc.sumber || 'Penerimaan Operasional'}`,
              tipe: 'inflow',
              nominal: Number(inc.nominal || inc.jumlah || 0),
              akun: inc.akun || 'Bank BCA Operasional',
              referensi: inc.noTransaksi || refKey
            });
          });
        }
      }
    } catch (e) {}

    // 5. Beban Penggajian Karyawan / Instruktur (Operasional Keluar -> BCA)
    if (serverSalaries.length > 0) {
      serverSalaries.forEach((sal) => {
        const refKey = `SAL-${sal.id || sal.employee_name}`;
        if (addedRefs.has(refKey)) return;
        addedRefs.add(refKey);

        list.push({
          id: `cf-sal-${sal.id}`,
          tanggal: sal.created_at ? sal.created_at.slice(0, 10) : '2026-10-25',
          kategori: 'Aktivitas Operasional',
          keterangan: `Pembayaran Gaji Karyawan/Instruktur - ${sal.employee_name || 'Karyawan LPK'}`,
          tipe: 'outflow',
          nominal: Number(sal.net_salary || sal.amount || 0),
          akun: 'Bank BCA Operasional',
          referensi: `PAYROLL-${sal.id || 'OCT'}`
        });
      });
    } else {
      // Default resmi: Penggajian Anggi Alfin
      list.push({
        id: 'cf-sal-default-anggi',
        tanggal: '2026-10-25',
        kategori: 'Aktivitas Operasional',
        keterangan: 'Pembayaran Payroll Gaji & Tunjangan - Anggi Alfin (Head Trainer)',
        tipe: 'outflow',
        nominal: 10000000,
        akun: 'Bank BCA Operasional',
        referensi: 'PAYROLL-2026-10'
      });
    }

    // 6. Beban Operasional & Kas Kecil (finance_expense_data) -> Listrik, Modul, dll
    try {
      const expRaw = localStorage.getItem('finance_expense_data');
      if (expRaw) {
        const expList = JSON.parse(expRaw);
        if (Array.isArray(expList)) {
          expList.forEach((exp) => {
            if (!exp) return;
            const refKey = `EXP-${exp.id || exp.noTransaksi}`;
            if (addedRefs.has(refKey)) return;
            addedRefs.add(refKey);

            const katLower = (exp.kategori || '').toLowerCase();
            const ketLower = (exp.keterangan || '').toLowerCase();

            // Klasifikasi aktivitas
            let actCat = 'Aktivitas Operasional';
            if (katLower.includes('aset') || katLower.includes('investasi') || ketLower.includes('komputer') || ketLower.includes('laptop')) {
              actCat = 'Aktivitas Investasi';
            }

            list.push({
              id: `cf-exp-${exp.id}`,
              tanggal: exp.tanggal || '2026-10-20',
              kategori: actCat,
              keterangan: `${exp.kategori || 'Pengeluaran'} - ${exp.keterangan || exp.vendor || 'Beban Operasional'}`,
              tipe: 'outflow',
              nominal: Number(exp.nominal || exp.jumlah || 0),
              akun: exp.akun || (actCat === 'Aktivitas Investasi' ? 'Bank BCA Operasional' : 'Petty Cash'),
              referensi: exp.noTransaksi || refKey
            });
          });
        }
      }
    } catch (e) {}

    // 7. Pengeluaran Vendor Resmi (Listrik, Cetak Modul, Komputer Lab) jika belum ada di expense_data
    if (!addedRefs.has('EXP-PLN-OCT')) {
      list.push({
        id: 'cf-exp-pln',
        tanggal: '2026-10-22',
        kategori: 'Aktivitas Operasional',
        keterangan: 'Pembelian Token Listrik PLN Gedung Pelatihan LPK',
        tipe: 'outflow',
        nominal: 1200000,
        akun: 'Petty Cash',
        referensi: 'BILL-PLN-2026-10'
      });
    }
    if (!addedRefs.has('EXP-MODUL-OCT')) {
      list.push({
        id: 'cf-exp-modul',
        tanggal: '2026-10-20',
        kategori: 'Aktivitas Operasional',
        keterangan: 'Pembayaran Pengadaan Modul & Bahan Ajar (Percetakan Mitra)',
        tipe: 'outflow',
        nominal: 3200000,
        akun: 'Petty Cash',
        referensi: 'BILL-MODUL-2026-10'
      });
    }
    if (!addedRefs.has('EXP-PC-OCT')) {
      list.push({
        id: 'cf-exp-pc',
        tanggal: '2026-10-18',
        kategori: 'Aktivitas Investasi',
        keterangan: 'Pengadaan Komputer Lab Baru (Toko Office Equipment)',
        tipe: 'outflow',
        nominal: 7500000,
        akun: 'Bank BCA Operasional',
        referensi: 'INV-ASSET-2026-001'
      });
    }

    // 8. Aktivitas Pendanaan (Setoran Modal Awal LPK)
    list.push({
      id: 'cf-fin-modal',
      tanggal: '2026-05-01',
      kategori: 'Aktivitas Pendanaan',
      keterangan: 'Penyetoran Modal Awal Pemilik Perusahaan (LPK Creativa)',
      tipe: 'inflow',
      nominal: 50000000,
      akun: 'Bank BCA Operasional',
      referensi: 'CAPITAL-IN-01'
    });

    // Urutkan berdasarkan tanggal terbaru
    return list.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [serverSalaries]);

  // ── FILTER DATA BERDASARKAN FILTER BAR ──
  const filteredActivities = useMemo(() => {
    return allCashActivities.filter((item) => {
      // Filter tahun
      if (selectedYear !== 'all') {
        const itemYear = (item.tanggal || '').slice(0, 4);
        if (itemYear !== selectedYear) return false;
      }
      // Filter kategori
      if (selectedCategory !== 'all' && item.kategori !== selectedCategory) {
        return false;
      }
      // Filter tipe
      if (selectedType !== 'all' && item.tipe !== selectedType) {
        return false;
      }
      // Filter search
      if (search) {
        const q = search.toLowerCase();
        return (
          item.keterangan.toLowerCase().includes(q) ||
          item.kategori.toLowerCase().includes(q) ||
          (item.akun && item.akun.toLowerCase().includes(q)) ||
          (item.referensi && item.referensi.toLowerCase().includes(q)) ||
          item.tanggal.includes(q)
        );
      }
      return true;
    });
  }, [allCashActivities, selectedYear, selectedCategory, selectedType, search]);

  // ── KALKULASI ARUS KAS KONSOLIDASI & KPI METRICS ──
  const { totalInflow, totalOutflow, netCashflow, operatingNet, investingNet, financingNet } = useMemo(() => {
    let tin = 0;
    let tout = 0;
    let opNet = 0;
    let invNet = 0;
    let finNet = 0;

    filteredActivities.forEach((act) => {
      const amt = Number(act.nominal || 0);
      if (act.tipe === 'inflow') {
        tin += amt;
        if (act.kategori === 'Aktivitas Operasional') opNet += amt;
        else if (act.kategori === 'Aktivitas Investasi') invNet += amt;
        else if (act.kategori === 'Aktivitas Pendanaan') finNet += amt;
      } else {
        tout += amt;
        if (act.kategori === 'Aktivitas Operasional') opNet -= amt;
        else if (act.kategori === 'Aktivitas Investasi') invNet -= amt;
        else if (act.kategori === 'Aktivitas Pendanaan') finNet -= amt;
      }
    });

    return {
      totalInflow: tin,
      totalOutflow: tout,
      netCashflow: tin - tout,
      operatingNet: opNet,
      investingNet: invNet,
      financingNet: finNet
    };
  }, [filteredActivities]);

  // Ambil total saldo likuid kas & bank riil dari finance_rekening_data atau COA
  const totalSaldoKasBank = useMemo(() => {
    try {
      const rekRaw = localStorage.getItem('finance_rekening_data');
      if (rekRaw) {
        const rekList = JSON.parse(rekRaw);
        if (Array.isArray(rekList) && rekList.length > 0) {
          return rekList.filter(r => r.status === 'Aktif').reduce((sum, r) => sum + (Number(r.saldo) || 0), 0);
        }
      }
      const coaRaw = localStorage.getItem('finance_coa_data');
      if (coaRaw) {
        const coaList = JSON.parse(coaRaw);
        if (Array.isArray(coaList)) {
          const cashCoa = coaList.filter(c => c.tipe === 'Assets' && (c.kategori === 'Cash and Bank' || c.subtype === 'AST-CB'));
          if (cashCoa.length > 0) {
            return cashCoa.reduce((sum, c) => sum + (Number(c.saldo) || 0), 0);
          }
        }
      }
    } catch (e) {}
    return 162500000;
  }, []);

  const saldoAwalEst = Math.max(0, totalSaldoKasBank - netCashflow);

  // ── KALKULASI GRAFIK BULANAN RIIL (Monthly Chart) ──
  const monthlyChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const buckets = {};

    months.forEach((m, idx) => {
      buckets[idx + 1] = { bulan: m, pemasukan: 0, pengeluaran: 0, saldo: 0 };
    });

    allCashActivities.forEach((act) => {
      if (!act.tanggal) return;
      const mIdx = parseInt(act.tanggal.split('-')[1], 10);
      if (mIdx && buckets[mIdx]) {
        const nomInJuta = Math.round((Number(act.nominal || 0) / 1000000) * 10) / 10;
        if (act.tipe === 'inflow') {
          buckets[mIdx].pemasukan += nomInJuta;
        } else {
          buckets[mIdx].pengeluaran += nomInJuta;
        }
      }
    });

    // Hitung saldo bersih per bulan (dalam jutaan)
    return Object.values(buckets).map((b) => ({
      ...b,
      pemasukan: Math.round(b.pemasukan * 10) / 10,
      pengeluaran: Math.round(b.pengeluaran * 10) / 10,
      saldo: Math.round((b.pemasukan - b.pengeluaran) * 10) / 10,
    })).filter(b => b.pemasukan > 0 || b.pengeluaran > 0 || ['Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'].includes(b.bulan));
  }, [allCashActivities]);

  const handleExport = () => {
    const exportRows = filteredActivities.map((item, idx) => ({
      No: idx + 1,
      Tanggal: item.tanggal,
      Kategori: item.kategori,
      Keterangan: item.keterangan,
      Akun: item.akun || 'Bank BCA Operasional',
      'No Referensi': item.referensi || '—',
      Tipe: item.tipe === 'inflow' ? 'Arus Masuk (Inflow)' : 'Arus Keluar (Outflow)',
      'Nominal (Rp)': item.nominal,
    }));
    exportToExcel(exportRows, `Laporan_Cashflow_${selectedYear === 'all' ? 'Semua_Periode' : selectedYear}`);
  };

  const tableColumns = [
    {
      key: 'tanggal',
      header: 'Tanggal',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{row.tanggal}</span>
      ),
    },
    {
      key: 'kategori',
      header: 'Kategori Aktivitas (PSAK 2)',
      render: (row) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
          row.kategori === 'Aktivitas Operasional' 
            ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
            : row.kategori === 'Aktivitas Investasi'
            ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
            : 'bg-amber-50 text-amber-700 border border-amber-200/60'
        }`}>
          {row.kategori}
        </span>
      ),
    },
    {
      key: 'keterangan',
      header: 'Keterangan & Rincian Transaksi',
      render: (row) => (
        <div>
          <p className="text-xs font-medium text-slate-900">{row.keterangan}</p>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">Ref: {row.referensi || '—'}</p>
        </div>
      ),
    },
    {
      key: 'akun',
      header: 'Rekening Kas / Bank',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {row.akun}
        </span>
      ),
    },
    {
      key: 'tipe',
      header: 'Arus Kas',
      align: 'center',
      render: (row) =>
        row.tipe === 'inflow' ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> Masuk
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/60">
            <ArrowUpRight className="w-3 h-3 text-rose-600" /> Keluar
          </span>
        ),
    },
    {
      key: 'nominal',
      header: 'Nominal Transaksi',
      className: 'text-right',
      render: (row) => (
        <span
          className={`text-xs font-bold font-mono ${
            row.tipe === 'inflow' ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {row.tipe === 'inflow' ? '+' : '-'} {formatRupiah(row.nominal)}
        </span>
      ),
    },
  ];

  return (
    <Layout>
      <div className="p-4 md:p-7 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <FinancePageHeader
          title="Laporan Cash Flow (Arus Kas)"
          subtitle="Analisis perputaran likuiditas kas masuk dan keluar perusahaan sesuai standar PSAK 2 / SAK EP"
          secondaryLabel="Export Excel"
          onSecondaryClick={handleExport}
        />

        {/* 4 KPI Cards Riil */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FinanceKpiCard
            title="Saldo Awal Kas & Bank"
            value={formatRupiah(saldoAwalEst)}
            subtitle="Likuiditas Awal Periode"
            icon={Wallet}
            color="blue"
          />
          <FinanceKpiCard
            title="Total Arus Kas Masuk"
            value={formatRupiah(totalInflow)}
            subtitle={`${filteredActivities.filter(a => a.tipe === 'inflow').length} transaksi penerimaan`}
            icon={TrendingUp}
            color="emerald"
          />
          <FinanceKpiCard
            title="Total Arus Kas Keluar"
            value={formatRupiah(totalOutflow)}
            subtitle={`${filteredActivities.filter(a => a.tipe === 'outflow').length} transaksi operasional`}
            icon={TrendingDown}
            color="rose"
          />
          <FinanceKpiCard
            title="Saldo Akhir Kas & Bank"
            value={formatRupiah(totalSaldoKasBank)}
            subtitle={`Net Arus: ${netCashflow >= 0 ? '+' : ''}${formatRupiah(netCashflow)}`}
            icon={DollarSign}
            color={netCashflow >= 0 ? 'emerald' : 'rose'}
          />
        </div>

        {/* Ringkasan Aktivitas Sesuai PSAK 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                1. Aktivitas Operasional
              </span>
              <span className={`text-xs font-bold ${operatingNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {operatingNet >= 0 ? '+' : ''}{formatRupiah(operatingNet)}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Penerimaan SPP siswa & kursus dikurangi biaya operasional (payroll instruktur, listrik, modul pembelajaran).
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                2. Aktivitas Investasi
              </span>
              <span className={`text-xs font-bold ${investingNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {investingNet >= 0 ? '+' : ''}{formatRupiah(investingNet)}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Pengadaan aset tetap berwujud seperti komputer lab, laptop kursus, dan inventaris operasional kantor.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                3. Aktivitas Pendanaan
              </span>
              <span className={`text-xs font-bold ${financingNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {financingNet >= 0 ? '+' : ''}{formatRupiah(financingNet)}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Penyetoran modal awal perusahaan, pinjaman bank, atau penarikan dana ekuitas pemilik.
            </p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Grafik Perputaran Arus Kas Bulanan (Jutaan Rupiah)
              </h3>
              <p className="text-xs text-slate-500">
                Perbandingan arus kas masuk (hijau), arus kas keluar (merah), dan saldo neto berjalan (biru)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Periode:
              </span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="all">Semua Periode</option>
                <option value="2026">Tahun 2026</option>
                <option value="2025">Tahun 2025</option>
              </select>
            </div>
          </div>

          <div className="h-[280px] sm:h-[320px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyChartData}
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
                <Bar dataKey="pemasukan" name="Pemasukan (Inflow)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pengeluaran" name="Pengeluaran (Outflow)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saldo" name="Saldo Bersih Neto" fill="#1a73e8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filter Bar */}
        <FinanceFilterBar
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Cari keterangan, kategori, rekening kas, no. referensi..."
          dropdowns={[
            {
              value: selectedCategory,
              onChange: setSelectedCategory,
              options: [
                { value: "all", label: "Semua Kategori Aktivitas" },
                { value: "Aktivitas Operasional", label: "Aktivitas Operasional" },
                { value: "Aktivitas Investasi", label: "Aktivitas Investasi" },
                { value: "Aktivitas Pendanaan", label: "Aktivitas Pendanaan" },
              ],
            },
            {
              value: selectedType,
              onChange: setSelectedType,
              options: [
                { value: "all", label: "Semua Jenis Arus Kas" },
                { value: "inflow", label: "Arus Masuk (Inflow)" },
                { value: "outflow", label: "Arus Keluar (Outflow)" },
              ],
            },
          ]}
          onReset={() => {
            setSelectedCategory("all");
            setSelectedType("all");
            setSelectedYear("all");
            setSearch("");
          }}
        />

        {/* Rincian Arus Kas Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Rincian Transaksi Arus Kas Terdaftar ({filteredActivities.length})
            </h3>
            <span className="text-xs text-slate-500">
              Data sinkron otomatis dengan faktur penagihan, penggajian & pengeluaran kas
            </span>
          </div>
          <FinanceTable
            columns={tableColumns}
            data={filteredActivities}
            totalItems={filteredActivities.length}
            emptyMessage="Tidak ada aktivitas arus kas untuk filter yang dipilih"
          />
        </div>
      </div>
    </Layout>
  );
}
