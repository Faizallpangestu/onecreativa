import axios from "axios";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const n = value => Number(value || 0);
const monthIndex = label => Math.max(0, MONTHS.findIndex(m => String(label).toLowerCase().startsWith(m.toLowerCase())));
const monthEnd = (year, month) => new Date(year, month + 1, 0).toISOString().slice(0, 10);
const rangeFor = label => {
  const month = monthIndex(label);
  const year = Number(String(label).match(/\d{4}/)?.[0] || new Date().getFullYear());
  return { year, month, from: `${year}-${String(month + 1).padStart(2, "0")}-01`, to: monthEnd(year, month) };
};
const groupTotal = (rows, predicate) => (rows || []).filter(predicate).reduce((sum, row) => sum + n(row.balance), 0);
const pct = (value, base) => base ? Number(((value / base) * 100).toFixed(1)) : 0;

const reportShape = (current, previous, dashboard) => {
  const cp = current?.profit_loss || {};
  const pp = previous?.profit_loss || {};
  const cs = current?.balance_sheet || {};
  const ps = previous?.balance_sheet || {};
  const rows = current?.trial_balance?.rows || [];
  const prevRows = previous?.trial_balance?.rows || [];
  const item = (name, value, prev, catatan) => ({ nama: name, catatan, okt: value, sep: prev, diff: value - prev, pct: pct(value - prev, prev) });
  const cls = name => row => row.report_class === name;
  const group = group => row => Number(row.account_group) === group;

  const asetLancar = [
    item("Kas & Bank", n(cs.cash_bank), n(ps.cash_bank), 1),
    item("Piutang Usaha", n(cs.receivables), n(ps.receivables), 2),
    item("Persediaan", groupTotal(rows, cls("inventory")), groupTotal(prevRows, cls("inventory")), 3),
    item("Biaya Dibayar Dimuka", groupTotal(rows, cls("prepayment")), groupTotal(prevRows, cls("prepayment")), 4),
  ];
  const asetTidakLancar = [
    item("Aset Tetap", groupTotal(rows, cls("fixed_asset")), groupTotal(prevRows, cls("fixed_asset")), 5),
    item("Aset Lainnya", groupTotal(rows, cls("other_asset")), groupTotal(prevRows, cls("other_asset")), 6),
  ];
  const liabilitasPendek = [
    item("Utang Usaha", groupTotal(rows, cls("payable")), groupTotal(prevRows, cls("payable")), 7),
    item("Utang Gaji", groupTotal(rows, cls("payroll_payable")), groupTotal(prevRows, cls("payroll_payable")), 8),
    item("Utang Pajak", groupTotal(rows, cls("tax_payable")), groupTotal(prevRows, cls("tax_payable")), 9),
    item("Pendapatan Diterima Dimuka", groupTotal(rows, cls("deferred_revenue")), groupTotal(prevRows, cls("deferred_revenue")), 10),
  ];
  const liabilitasPanjang = [item("Utang Pinjaman", groupTotal(rows, cls("loan")), groupTotal(prevRows, cls("loan")), 11)];
  const ekuitas = [
    item("Modal & Ekuitas", groupTotal(rows, group(3)), groupTotal(prevRows, group(3)), 12),
    item("Laba Ditahan", n(cs.unclosed_profit), n(ps.unclosed_profit), 13),
    item("Laba Periode Berjalan", n(cp.net_profit), n(pp.net_profit), null),
  ];
  const totalRevenue = n(cp.revenue) + n(cp.other_income);
  const previousRevenue = n(pp.revenue) + n(pp.other_income);
  const totalExpenses = n(cp.cost_of_services) + n(cp.operating_expense) + n(cp.other_expense) + n(cp.income_tax);
  const previousExpenses = n(pp.cost_of_services) + n(pp.operating_expense) + n(pp.other_expense) + n(pp.income_tax);
  const monthly = (dashboard?.months || []).map(row => ({
    bulan: row.label,
    pendapatan: n(row.income) / 1000000,
    beban: n(row.expense) / 1000000,
    laba: (n(row.income) - n(row.expense)) / 1000000,
    kasMasuk: n(row.income) / 1000000,
    kasKeluar: n(row.expense) / 1000000,
    saldoKas: 0,
  }));
  const cashFlow = current?.cash_flow || [];
  const flow = name => cashFlow.filter(row => row.cash_flow_class === name).reduce((sum, row) => sum + n(row.net), 0);
  const compositions = (items, total) => items.map(([name, value, color]) => ({ name, value: pct(value, total), color }));
  return {
    kpis: {
      totalRevenue, totalRevenueSep: previousRevenue, revGrowth: pct(totalRevenue - previousRevenue, previousRevenue).toFixed(1),
      totalExpenses, totalExpensesSep: previousExpenses, expGrowth: pct(totalExpenses - previousExpenses, previousExpenses).toFixed(1),
      netProfit: n(cp.net_profit), netProfitSep: n(pp.net_profit), profitGrowth: pct(n(cp.net_profit) - n(pp.net_profit), Math.abs(n(pp.net_profit))).toFixed(1),
      cashAndBank: n(cs.cash_bank), cashAndBankSep: n(ps.cash_bank), cashGrowth: pct(n(cs.cash_bank) - n(ps.cash_bank), n(ps.cash_bank)).toFixed(1),
      totalAssets: n(cs.assets), totalAssetsSep: n(ps.assets), assetGrowth: pct(n(cs.assets) - n(ps.assets), n(ps.assets)).toFixed(1),
      totalLiabilities: n(cs.liabilities), totalLiabilitiesSep: n(ps.liabilities), liabGrowth: pct(n(cs.liabilities) - n(ps.liabilities), n(ps.liabilities)).toFixed(1),
      totalEquity: n(cs.total_equity), totalEquitySep: n(ps.total_equity), equityGrowth: pct(n(cs.total_equity) - n(ps.total_equity), n(ps.total_equity)).toFixed(1),
      currentRatio: n(cs.liabilities) ? n(cs.assets) / n(cs.liabilities) : 0,
      currentRatioStatus: n(cs.liabilities) && n(cs.assets) / n(cs.liabilities) >= 1.5 ? "Sehat" : "Normal",
    },
    balanceSheet: {
      asetLancar, asetTidakLancar, liabilitasPendek, liabilitasPanjang, ekuitas,
      totAsetLancarOkt: asetLancar.reduce((s, x) => s + x.okt, 0), totAsetLancarSep: asetLancar.reduce((s, x) => s + x.sep, 0),
      totAsetTidakLancarOkt: asetTidakLancar.reduce((s, x) => s + x.okt, 0), totAsetTidakLancarSep: asetTidakLancar.reduce((s, x) => s + x.sep, 0),
      totalAsetOkt: n(cs.assets), totalAsetSep: n(ps.assets), totalLiabilitasOkt: n(cs.liabilities), totalLiabilitasSep: n(ps.liabilities),
      totalEkuitasOkt: n(cs.total_equity), totalEkuitasSep: n(ps.total_equity), totalLiabEkuitasOkt: n(cs.liabilities) + n(cs.total_equity), totalLiabEkuitasSep: n(ps.liabilities) + n(ps.total_equity),
      diffAsetLancar: 0, pctAsetLancar: "0,0", diffAsetTidakLancar: 0, pctAsetTidakLancar: "0,0", diffTotalAset: n(cs.assets) - n(ps.assets), pctTotalAset: pct(n(cs.assets) - n(ps.assets), n(ps.assets)).toFixed(1),
      totLiabPendekOkt: liabilitasPendek.reduce((s, x) => s + (x.okt || 0), 0), totLiabPendekSep: liabilitasPendek.reduce((s, x) => s + (x.sep || 0), 0), totLiabPanjangOkt: liabilitasPanjang?.[0]?.okt || 0, totLiabPanjangSep: liabilitasPanjang?.[0]?.sep || 0,
      diffLiabPendek: 0, pctLiabPendek: "0,0", diffLiabPanjang: 0, pctLiabPanjang: "0,0", diffTotalLiab: n(cs.liabilities) - n(ps.liabilities), pctTotalLiab: pct(n(cs.liabilities) - n(ps.liabilities), n(ps.liabilities)).toFixed(1),
      diffTotalEkuitas: n(cs.total_equity) - n(ps.total_equity), pctTotalEkuitas: pct(n(cs.total_equity) - n(ps.total_equity), n(ps.total_equity)).toFixed(1), diffTotalLiabEkuitas: 0, pctTotalLiabEkuitas: "0,0",
    },
    pnl: { totRevOkt: totalRevenue, totRevSep: previousRevenue, totHppOkt: n(cp.cost_of_services), totHppSep: n(pp.cost_of_services), labaKotorOkt: n(cp.gross_profit), labaKotorSep: n(pp.gross_profit), totOpexOkt: n(cp.operating_expense), totOpexSep: n(pp.operating_expense), labaOperasiOkt: n(cp.operating_profit), labaOperasiSep: n(pp.operating_profit), bebanLainOkt: n(cp.other_expense), bebanLainSep: n(pp.other_expense), pajakOkt: n(cp.income_tax), pajakSep: n(pp.income_tax), netProfitOkt: n(cp.net_profit), netProfitSep: n(pp.net_profit) },
    ratios: [],
    compositions: {
      revenue: compositions([["Pendapatan Pelatihan", n(cp.revenue), "#2563EB"], ["Pendapatan Lain", n(cp.other_income), "#10B981"]], totalRevenue),
      assets: compositions([["Kas & Bank", n(cs.cash_bank), "#2563EB"], ["Piutang", n(cs.receivables), "#F59E0B"], ["Aset Lainnya", n(cs.assets) - n(cs.cash_bank) - n(cs.receivables), "#10B981"]], n(cs.assets)),
      liabEquity: compositions([["Liabilitas", n(cs.liabilities), "#F59E0B"], ["Ekuitas", n(cs.total_equity), "#10B981"]], n(cs.liabilities) + n(cs.total_equity)),
    },
    cashflow: { operating: flow("operating"), investing: flow("investing"), financing: flow("financing"), netChange: cashFlow.reduce((s, row) => s + n(row.net), 0) },
    monthlyPnLData: monthly, monthlyCashflowData: monthly,
    metadata: { from: current?.from, to: current?.to, coverage: current?.coverage },
  };
};

export async function fetchRealFinancialData(selectedPeriod, comparePeriod) {
  const currentRange = rangeFor(selectedPeriod);
  const previousRange = rangeFor(comparePeriod);

  // Fetch semua API secara paralel, tapi jangan crash jika satu gagal
  const safeGet = (url) => axios.get(url).catch(() => ({ data: { status: "error", data: null } }));

  const [current, previous, dashboard] = await Promise.all([
    safeGet(`/api/accounting.php?view=reports&from=${currentRange.from}&to=${currentRange.to}`),
    safeGet(`/api/accounting.php?view=reports&from=${previousRange.from}&to=${previousRange.to}`),
    safeGet(`/api/finance_dashboard.php?year=${currentRange.year}`),
  ]);

  // Selalu return reportShape yang valid meskipun data kosong / server baru diinisialisasi
  const currentData = current.data?.status === "success" ? current.data.data : null;
  const previousData = previous.data?.status === "success" ? previous.data.data : null;
  const dashboardData = dashboard.data?.status === "success" ? dashboard.data.data : { months: [] };

  return reportShape(currentData, previousData, dashboardData);
}
