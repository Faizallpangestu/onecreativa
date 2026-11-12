import React, { useState, useRef, useEffect } from "react";
import { 
  Search, Download, Plus, Calendar, ChevronLeft, ChevronRight, 
  Filter, RotateCcw, X, Check, AlertCircle, ArrowUpRight, ArrowDownRight, Database, ChevronDown
} from "lucide-react";
import * as XLSX from "xlsx-js-style";

export function formatRupiah(num) {
  if (num == null || isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function exportToExcel(data, fileName = "Data_Export") {
  if (!data || !data.length) return;
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ── HEADER ──
export function FinancePageHeader({
  title,
  subtitle,
  primaryLabel,
  onPrimaryClick,
  primaryIcon = Plus,
  secondaryLabel = "Export Excel",
  onSecondaryClick,
  secondaryIcon = Download,
  children,
}) {
  const showPrimaryIcon = primaryIcon && !primaryLabel?.trim().startsWith("+");
  const PrimaryIcon = primaryIcon;
  const SecondaryIcon = secondaryIcon;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs md:text-sm text-slate-500 mt-1 font-normal">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2.5 flex-wrap">
        {children}
        {secondaryLabel && (
          <button
            type="button"
            onClick={onSecondaryClick}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
          >
            <SecondaryIcon className="w-4 h-4 text-slate-500" />
            <span>{secondaryLabel}</span>
          </button>
        )}
        {primaryLabel && (
          <button
            type="button"
            onClick={onPrimaryClick}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#1a73e8] rounded-xl hover:bg-blue-600 active:bg-blue-700 transition shadow-sm hover:shadow"
          >
            {showPrimaryIcon && <PrimaryIcon className="w-4 h-4 text-white" />}
            <span>{primaryLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ── KPI STAT CARD ──
export function FinanceKpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "blue",
  badge,
  isPositive,
}) {
  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-[#1a73e8]", border: "border-blue-100" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
    rose: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
  };
  const theme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-500 truncate">{title}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${theme.bg} ${theme.text}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">{value}</div>
        {badge && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

// ── FILTER BAR ──
export function FinanceFilterBar({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  dropdowns = [],
  search,
  setSearch,
  searchPlaceholder = "Cari transaksi...",
  onReset,
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-3 md:p-3.5 mb-5 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Date range inputs */}
          {(setStartDate || setEndDate) && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={startDate || ""}
                onChange={(e) => setStartDate && setStartDate(e.target.value)}
                className="bg-transparent border-none text-xs focus:outline-none text-slate-700 cursor-pointer"
              />
              <span className="text-slate-400">—</span>
              <input
                type="date"
                value={endDate || ""}
                onChange={(e) => setEndDate && setEndDate(e.target.value)}
                className="bg-transparent border-none text-xs focus:outline-none text-slate-700 cursor-pointer"
              />
            </div>
          )}

          {/* Select dropdown filters */}
          {dropdowns.map((dd, idx) => (
            <select
              key={idx}
              value={dd.value}
              onChange={(e) => dd.onChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
            >
              {dd.options.map((opt, optIdx) => (
                <option key={optIdx} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              title="Reset Filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Input */}
        {setSearch && (
          <div className="relative w-full lg:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search || ""}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── STATUS BADGE ──
export function FinanceBadge({ status, text, label }) {
  const displayVal = text || status || label || "";
  const s = String(displayVal).toLowerCase();
  
  if (s.includes("lunas") || s.includes("paid") || s.includes("approved") || s.includes("posted") || s.includes("aktif") || s.includes("match") || s.includes("sukses") || s.includes("cocok") || s.includes("selesai") || s.includes("berhasil")) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100/80">
        {displayVal}
      </span>
    );
  }
  if (s.includes("pending") || s.includes("draft") || s.includes("menunggu") || s.includes("sebagian") || s.includes("review")) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-100/80">
        {displayVal}
      </span>
    );
  }
  if (s.includes("belum") || s.includes("tempo") || s.includes("overdue") || s.includes("nonaktif") || s.includes("ditolak") || s.includes("batal") || s.includes("gagal") || s.includes("selisih")) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-100/80">
        {displayVal}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
      {displayVal}
    </span>
  );
}

// ── TABLE CONTAINER ──
export function FinanceTable({
  columns = [],
  data = [],
  loading = false,
  emptyText = "Belum ada data tersedia.",
  page = 1,
  totalPages = 1,
  setPage,
  totalItems = 0,
  perPage = 10,
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3 px-4 text-[11px] font-bold tracking-wider text-slate-500 uppercase ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"} ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mb-2" />
                  <p>Memuat data tersimpan...</p>
                </td>
              </tr>
            ) : !data.length ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr key={row.id || rowIdx} className="hover:bg-slate-50/60 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`py-3 px-4 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"} ${col.className || ""}`}
                    >
                      {col.render ? col.render(row, rowIdx) : row[col.accessor] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/30">
          <div>
            Menampilkan <span className="font-semibold text-slate-700">{data.length}</span> dari{" "}
            <span className="font-semibold text-slate-700">{totalItems || data.length}</span> data
          </div>
          {setPage && totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`min-w-7 h-7 px-2 rounded-lg text-xs font-semibold transition ${
                      page === p
                        ? "bg-[#1a73e8] text-white shadow-2xs"
                        : "text-slate-600 hover:bg-white border border-transparent hover:border-slate-200"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MODAL DIALOG ──
export function FinanceModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  onSubmit,
  submitText = "Simpan Data",
  busy = false,
  maxWidth = "max-w-lg",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div 
        className={`bg-white rounded-2xl shadow-xl border border-slate-100 w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {children}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#1a73e8] rounded-xl hover:bg-blue-600 transition shadow-xs disabled:opacity-50"
            >
              {busy ? "Menyimpan..." : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── BACKUP DB BUTTON (SQL & CSV) ──
export function FinanceBackupButton({ startDate = "2026-08-01", endDate = "2026-09-30" }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const handleDownload = async (from, to, format) => {
    setBusy(true);
    setErrorMsg("");
    try {
      const qs = new URLSearchParams({
        from: from || "2026-08-01",
        to: to || "2026-09-30",
        format,
        type: "all",
        download: "1",
      });
      const res = await fetch(`/api/finance_backup_export.php?${qs.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        let msg = `Gagal menarik backup (HTTP ${res.status})`;
        try {
          const payload = await res.json();
          if (payload?.message) msg = payload.message;
        } catch {
          // ignore non-json error body
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_finance_${from}_sd_${to}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (err) {
      setErrorMsg(err?.message || "Gagal mengunduh backup database.");
    } finally {
      setBusy(false);
    }
  };

  const hasCustomFilter =
    Boolean(startDate && endDate) &&
    (startDate !== "2026-08-01" || endDate !== "2026-09-30");

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setErrorMsg("");
          setOpen((prev) => !prev);
        }}
        className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition shadow-2xs disabled:opacity-60"
        title="Unduh Backup SQL / CSV transaksi Pemasukan & Pengeluaran langsung dari database server"
      >
        <Database className="w-4 h-4 text-emerald-600" />
        <span>{busy ? "Menyiapkan..." : "Backup DB (Agt–Sep)"}</span>
        <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-40 text-left">
          <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
            <p className="text-[11px] font-bold text-slate-800">Tarik Backup Pemasukan & Pengeluaran</p>
            <p className="text-[10px] text-slate-500">Format SQL memakai INSERT IGNORE (aman untuk restore deploy).</p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleDownload("2026-08-01", "2026-09-30", "sql")}
            className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition"
          >
            1. Backup SQL (01 Agt – 30 Sep 2026)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleDownload("2026-08-01", "2026-09-30", "csv")}
            className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition"
          >
            2. Backup Excel CSV (01 Agt – 30 Sep 2026)
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleDownload("2025-01-01", "2027-12-31", "csv")}
            className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition"
          >
            3. Backup Excel CSV Lengkap (Semua Data)
          </button>
          {hasCustomFilter && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDownload(startDate, endDate, "sql")}
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-blue-700 hover:bg-blue-50 transition border-t border-slate-100 mt-1"
              >
                4. Backup SQL Filter Aktif ({startDate} s/d {endDate})
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDownload(startDate, endDate, "csv")}
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium text-blue-700 hover:bg-blue-50 transition"
              >
                5. Backup Excel CSV Filter ({startDate} s/d {endDate})
              </button>
            </>
          )}
          {errorMsg && (
            <p className="px-2.5 pt-1.5 text-[11px] font-medium text-rose-600">{errorMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}
