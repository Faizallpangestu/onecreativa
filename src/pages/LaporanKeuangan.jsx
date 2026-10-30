import React from "react";
import { useSearchParams } from "react-router-dom";
import FinancialReportsSuite from "./finance/FinancialReportsSuite";

export default function LaporanKeuangan() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") || searchParams.get("report");

  let initialTab = "overview";
  if (tabParam === "balance_sheet" || tabParam === "neraca") {
    initialTab = "balance_sheet";
  } else if (tabParam === "pnl" || tabParam === "profit_loss" || tabParam === "laba_rugi") {
    initialTab = "pnl";
  } else if (tabParam === "cash_flow" || tabParam === "cashflow" || tabParam === "arus_kas") {
    initialTab = "cash_flow";
  } else if (tabParam === "adjustments" || tabParam === "penyesuaian") {
    initialTab = "adjustments";
  }

  return (
    <FinancialReportsSuite
      initialTab={initialTab}
      title={initialTab === "balance_sheet" ? "Balance Sheet (Neraca Keuangan)" : "Laporan Keuangan Terpadu"}
    />
  );
}
