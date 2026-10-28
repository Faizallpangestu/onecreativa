import LearningWorkspace from '../components/LearningWorkspace';
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx-js-style";
import Layout from "../components/Layout";

import { Search, FileDown, LogIn, LogOut } from "lucide-react";

const ATTENDANCE_API_URL = "/api/attendance.php";

function normalizeAttendanceResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  throw new Error(payload?.message || "Respons absensi tidak valid.");
}

function formatDateFull(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "short", year: "numeric" });
}

function formatDateShort(dateStr) {
  if (!dateStr) return "-";
  if (/^\d{8}$/.test(dateStr)) return dateStr;
  return dateStr.replace(/-/g, "");
}

function formatTimeOnly(timeValue) {
  if (!timeValue) return "--:--";
  const timePart = timeValue.includes(' ') ? timeValue.split(' ')[1] : timeValue;
  const [hours = "00", minutes = "00"] = timePart.split(":");
  return `${hours}:${minutes}`;
}

function expandToRows(items) {
  const rows = [];
  items.forEach((item) => {
    // IN row
    rows.push({
      ...item,
      _rowType: "IN",
      _jamAbsen: item.check_in ? formatTimeOnly(item.check_in) : "--:--",
      _tglSys: item.check_in
        ? (item.check_in.includes(" ") ? item.check_in.split(" ")[0].replace(/-/g, "") : formatDateShort(item.date))
        : formatDateShort(item.date),
    });
    // OUT row
    rows.push({
      ...item,
      _rowType: "OUT",
      _jamAbsen: item.check_out ? formatTimeOnly(item.check_out) : "--:--",
      _tglSys: item.check_out
        ? (item.check_out.includes(" ") ? item.check_out.split(" ")[0].replace(/-/g, "") : formatDateShort(item.date))
        : formatDateShort(item.date),
    });
  });
  return rows;
}

export default function LpkAttendance({role}) {
  return role === "SISWA" ? <LearningWorkspace mode="attendance"/> : <StaffAttendance role={role}/>;
}
function StaffAttendance({ role }) {
  

  const [loadError, setLoadError] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Table-specific
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [appliedStart, setAppliedStart] = useState(today);
  const [appliedEnd, setAppliedEnd] = useState(today);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableSearch, setTableSearch] = useState("");

  const loadAttendance = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(ATTENDANCE_API_URL);
      let data = normalizeAttendanceResponse(res.data);
      
      // Filter by role manually if the API returns everyone
      // Assumes there's a role_name or similar property
      if (role) {
         data = data.filter(u => {
            const r = (u.role_name || u.role || "").toUpperCase();
            if (role === "SENSEI") return r === "SENSEI";
            if (role === "SISWA") return r.startsWith("PESERTA_");
            return true;
         });
      }
      setAttendance(data); setLoadError("");
    } catch (err) {
      setLoadError(err.response?.data?.message || err.message || "Data absensi gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAttendance(); }, [role]);

  // ── Table Data ────────────────────────────────────────────────
  const adminFiltered = useMemo(() => {
    let items = attendance;
    if (appliedStart) items = items.filter((i) => i.date >= appliedStart);
    if (appliedEnd)   items = items.filter((i) => i.date <= appliedEnd);
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      items = items.filter((i) =>
        (i.name || "").toLowerCase().includes(q) ||
        (i.nik || "").toLowerCase().includes(q) ||
        (i.date || "").includes(q)
      );
    }
    return items;
  }, [attendance, appliedStart, appliedEnd, tableSearch]);

  const tableRows = useMemo(() => expandToRows(adminFiltered), [adminFiltered]);
  const totalPages = Math.ceil(tableRows.length / pageSize) || 1;
  const pagedRows = tableRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    const periodLabel =
      appliedStart && appliedEnd
        ? `${appliedStart} s/d ${appliedEnd}`
        : appliedStart
        ? `Dari ${appliedStart}`
        : appliedEnd
        ? `S/d ${appliedEnd}`
        : "Semua Periode";

    const headers = ["No", "Jabatan", "NIK/ID", "Nama", "Tgl Absen", "Jam Masuk", "Jam Pulang", "Status", "Tgl Sistem"];

    const dataRows = adminFiltered.map((item, idx) => [
      idx + 1,
      item.department || item.role_name || "-",
      item.nik || item.employee_code || "-",
      item.name || "-",
      formatDateFull(item.date),
      item.check_in  ? formatTimeOnly(item.check_in)  : "--:--",
      item.check_out ? formatTimeOnly(item.check_out) : "--:--",
      item.status === "present" ? "Hadir" : item.status || "-",
      item.check_in
        ? (item.check_in.includes(" ") ? item.check_in.split(" ")[0].replace(/-/g, "") : formatDateShort(item.date))
        : formatDateShort(item.date),
    ]);

    const titleStr = role === "SENSEI" ? "ABSENSI SENSEI" : role === "SISWA" ? "ABSENSI SISWA" : "ABSENSI LPK";
    const sheetData = [
      [`LAPORAN ${titleStr} — LPK CREATIVA`],
      [`Periode: ${periodLabel}   |   Diekspor: ${new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" })}`],
      [], // blank separator
      headers,
      ...dataRows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    const GREEN      = "4CAF50";
    const DARK_GREEN = "388E3C";
    const WHITE      = "FFFFFF";
    const LIGHT_GREY = "F5F5F5";
    const BORDER_COLOR = "BDBDBD";

    const thin = { style: "thin", color: { rgb: BORDER_COLOR } };
    const borderAll = { top: thin, bottom: thin, left: thin, right: thin };

    const setStyle = (r, c, style) => {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { v: "", t: "s" };
      ws[ref].s = style;
    };

    setStyle(0, 0, {
      font: { bold: true, sz: 13, color: { rgb: DARK_GREEN } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      fill: { fgColor: { rgb: "E8F5E9" } },
    });
    setStyle(1, 0, {
      font: { sz: 10, color: { rgb: "616161" } },
      alignment: { horizontal: "center", vertical: "center" },
      fill: { fgColor: { rgb: "F1F8E9" } },
    });

    for (let c = 0; c < headers.length; c++) {
      setStyle(3, c, {
        font: { bold: true, sz: 11, color: { rgb: WHITE } },
        fill: { fgColor: { rgb: GREEN } },
        alignment: { horizontal: "center", vertical: "center", wrapText: false },
        border: borderAll,
      });
    }

    dataRows.forEach((row, rowOffset) => {
      const r = 4 + rowOffset;
      const isEven = rowOffset % 2 === 0;
      const bgColor = isEven ? WHITE : LIGHT_GREY;
      for (let c = 0; c < headers.length; c++) {
        setStyle(r, c, {
          font: { sz: 10 },
          fill: { fgColor: { rgb: bgColor } },
          alignment: {
            horizontal: (c === 0 || c >= 5) ? "center" : "left",
            vertical: "center",
          },
          border: borderAll,
        });
      }
    });

    ws["!cols"] = [{ wch: 5 }, { wch: 18 }, { wch: 14 }, { wch: 28 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
    ];
    ws["!freeze"] = { xSplit: 0, ySplit: 4 };

    XLSX.utils.book_append_sheet(workbook, ws, "Absensi");
    XLSX.writeFile(workbook, `Absensi_${role}_${appliedStart}.xlsx`);
  };

  const pageTitle = role === "SENSEI" ? "Absensi Sensei" : role === "SISWA" ? "Absensi Siswa" : "Absensi LPK";
  useEffect(() => {
    document.title = `${pageTitle} | ONE Creativa`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", `Data ${pageTitle} terintegrasi untuk LPK ONE Creativa.`);
    }
  }, [pageTitle]);

  return (
    <Layout hideMobileHeader={true} hideBottomNav={true}>
      <div className="min-h-full bg-slate-50 pb-12">
        {loadError && <p role="alert" className="p-4 text-red-700 bg-red-50">{loadError}</p>}
        <div className="min-h-screen bg-[#f0f4f8]">
            <div className="p-4 md:p-6 max-w-[1200px] mx-auto">
              
              {/* Filter Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-5">
                <h2 className="text-[13px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Search className="w-4 h-4" /> Filter Tanggal Absen
                </h2>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="startDate" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Start From</label>
                    <input id="startDate" type="date" aria-label="Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                      className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] font-bold text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="endDate" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">End From</label>
                    <input id="endDate" type="date" aria-label="End Date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                      className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-[13px] font-bold text-slate-700 outline-none focus:border-blue-400 focus:bg-white transition" />
                  </div>
                  <button
                    onClick={() => { setAppliedStart(startDate); setAppliedEnd(endDate); setCurrentPage(1); }} aria-label="Search filter"
                    className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold transition active:scale-95 shadow-sm"
                  >
                    SEARCH
                  </button>
                  <button
                    onClick={() => {
                      setStartDate(today); setEndDate(today);
                      setAppliedStart(""); setAppliedEnd("");
                      setTableSearch(""); setCurrentPage(1);
                    }}
                    className="h-10 px-5 rounded-xl border border-slate-200 text-slate-500 text-[13px] font-bold hover:bg-slate-50 transition active:scale-95"
                  >
                    Reset
                  </button>
                  <button onClick={handleExportExcel} aria-label="Export to Excel" className="h-10 px-5 flex items-center gap-2 rounded-xl bg-[#0c2e59] hover:bg-[#1a4176] text-white text-[13px] font-bold transition active:scale-95 shadow-sm">
                    <FileDown className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>

              {/* Table Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-[13px] text-slate-600 font-semibold">
                    <span>Show</span>
                    <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                      className="border border-slate-200 rounded-lg px-2 py-1 bg-white text-[13px] font-bold text-slate-700 outline-none focus:border-blue-400">
                      {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span>entries</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-slate-600 font-semibold">
                    <span>Search:</span>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input type="text" value={tableSearch} onChange={(e) => { setTableSearch(e.target.value); setCurrentPage(1); }}
                        className="border border-slate-200 rounded-lg pl-8 pr-3 py-1 bg-white text-[13px] font-semibold text-slate-700 outline-none focus:border-blue-400 w-40" />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-blue-600 text-white">
                        <th className="px-4 py-3 text-left font-black uppercase tracking-wider whitespace-nowrap">Peran/Jabatan</th>
                        <th className="px-4 py-3 text-left font-black uppercase tracking-wider whitespace-nowrap">NIK/ID</th>
                        <th className="px-4 py-3 text-left font-black uppercase tracking-wider whitespace-nowrap">Nama</th>
                        <th className="px-4 py-3 text-left font-black uppercase tracking-wider whitespace-nowrap">Tgl Absen</th>
                        <th className="px-4 py-3 text-left font-black uppercase tracking-wider whitespace-nowrap">Jam Absen</th>
                        <th className="px-4 py-3 text-left font-black uppercase tracking-wider whitespace-nowrap">IN/OUT</th>
                        <th className="px-4 py-3 text-left font-black uppercase tracking-wider whitespace-nowrap">Tgl Sys</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                              <span className="text-slate-400 font-semibold text-[13px]">Memuat data...</span>
                            </div>
                          </td>
                        </tr>
                      ) : pagedRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                            Tidak ada data absensi.
                          </td>
                        </tr>
                      ) : (
                        pagedRows.map((row, idx) => {
                          const isIn  = row._rowType === "IN";
                          const isEven = idx % 2 === 0;
                          return (
                            <tr key={`${row.id}-${row._rowType}-${idx}`}
                              className={`border-b border-slate-100 transition hover:bg-blue-50/40 ${isEven ? "bg-white" : "bg-slate-50/60"}`}>
                              <td className="px-4 py-2.5 text-slate-700 font-semibold whitespace-nowrap">
                                {row.department || row.role_name || "-"}
                              </td>
                              <td className="px-4 py-2.5 text-slate-700 font-semibold whitespace-nowrap">
                                {row.nik || row.employee_code || "-"}
                              </td>
                              <td className="px-4 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                                {row.name || "-"}
                              </td>
                              <td className="px-4 py-2.5 text-slate-600 font-semibold whitespace-nowrap">
                                {formatDateShort(row.date)}
                              </td>
                              <td className="px-4 py-2.5 font-black text-slate-800 whitespace-nowrap text-[14px]">
                                {row._jamAbsen}
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black uppercase ${isIn ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                  {isIn ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                                  {row._rowType}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-slate-500 font-semibold whitespace-nowrap">
                                {row._tglSys}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50">
                  <p className="text-[12px] font-semibold text-slate-500">
                    Showing {tableRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, tableRows.length)} of {tableRows.length} entries
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <button key={p} onClick={() => setCurrentPage(p)} aria-label={`Go to page ${p}`}
                          className={`h-8 w-8 rounded-lg text-[12px] font-black transition ${currentPage === p ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
                          {p}
                        </button>
                      );
                    })}
                    {totalPages > 5 && <span className="text-slate-400 font-bold px-1">…</span>}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                    >
                      Next
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
      </div>
    </Layout>
  );
}
