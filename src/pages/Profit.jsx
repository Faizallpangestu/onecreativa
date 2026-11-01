import FinancialReportsSuite from "./finance/FinancialReportsSuite";

// Profit & Loss uses posted accounting journals as its only source of truth.
// Forecasts and browser storage are intentionally excluded from this report.
export default function ProfitAndLossPage() {
  return <FinancialReportsSuite initialTab="overview" title="Laporan Laba Rugi" />;
}
