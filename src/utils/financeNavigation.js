import { LayoutGrid, DollarSign, TrendingUp, TrendingDown, FileText, WalletCards, CreditCard, Banknote } from "lucide-react";

export const FINANCE_MENU_ITEMS = [
  { title: "Dashboard", icon: LayoutGrid, color: "text-emerald-500 bg-emerald-50", path: "/dashboard-finance" },
  { title: "Invoice", icon: FileText, color: "text-fuchsia-500 bg-fuchsia-50", path: "/invoice-penagihan" },
  { title: "Students", icon: FileText, color: "text-indigo-500 bg-indigo-50", path: "/finance/student-billing" },
  { title: "Transaksi Pemasukan", icon: TrendingUp, color: "text-blue-500 bg-blue-50", path: "/transaksi-pemasukan" },
  { title: "Transaksi Pengeluaran", icon: TrendingDown, color: "text-rose-500 bg-rose-50", path: "/transaksi-pengeluaran" },
  { title: "Bills (Tagihan)", icon: FileText, color: "text-amber-500 bg-amber-50", path: "/bills" },
  { title: "Vendor", icon: FileText, color: "text-cyan-500 bg-cyan-50", path: "/vendors" },
  { title: "Buku Transaksi", icon: FileText, color: "text-blue-500 bg-blue-50", path: "/buku-transaksi" },
  { title: "Chart of Accounts", icon: FileText, color: "text-violet-500 bg-violet-50", path: "/coa" },
  { title: "Journal", icon: FileText, color: "text-teal-500 bg-teal-50", path: "/journal" },
  { title: "General Ledger", icon: FileText, color: "text-emerald-500 bg-emerald-50", path: "/general-ledger" },
  { title: "Reconciliation", icon: FileText, color: "text-sky-500 bg-sky-50", path: "/reconciliation" },
  { title: "Rekening", icon: WalletCards, color: "text-blue-500 bg-blue-50", path: "/rekening" },
  { title: "Cashflow", icon: DollarSign, color: "text-emerald-500 bg-emerald-50", path: "/cashflow" },
  { title: "Transfer Dana", icon: CreditCard, color: "text-purple-500 bg-purple-50", path: "/transfer" },
  { title: "Laporan Keuangan", icon: DollarSign, color: "text-amber-500 bg-amber-50", path: "/laporan-keuangan" },
  { title: "Keuangan & Laba", icon: DollarSign, color: "text-amber-500 bg-amber-50", path: "/profit" },
  { title: "Anggaran", icon: WalletCards, color: "text-purple-500 bg-purple-50", path: "/anggaran" },
  { title: "Penggajian Karyawan", icon: Banknote, color: "text-emerald-500 bg-emerald-50", path: "/salary" },
  { title: "Reimbursement", icon: CreditCard, color: "text-blue-500 bg-blue-50", path: "/reimbursement" },
];

export function canAccessFinancePath(pathname) {
  const paths = [
    "/menu-finance",
    ...FINANCE_MENU_ITEMS.map(item => item.path),
    "/finance/student-billing",
    "/history-invoice",
    "/account-settings",
    "/bills",
    "/vendors",
    "/coa",
    "/journal",
    "/general-ledger",
    "/reconciliation",
    "/rekening",
    "/cashflow",
    "/transfer",
  ];
  return paths.some(path => pathname === path || pathname.startsWith(`${path}/`));
}
