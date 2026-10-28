import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Layout from "../components/Layout";

import {
  ChevronLeft, Search, FileDown, Edit2, Trash2,
  Calendar, LogIn, LogOut, FileText, Clock,
  Users, UserCheck, FileMinus, Activity, ChevronRight, Award, History, CheckCircle2,
  Filter, TrendingUp, TrendingDown,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { useSEO } from "../hooks/useSEO";

const ATTENDANCE_API_URL = "/api/attendance.php";

const positionRank = {
  "Direktur": 1,
  "Manager": 2,
  "SPV": 3,
  "Supervisor": 3,
  "HR": 4,
  "HRD": 4,
  "Staff": 5,
  "Karyawan": 6,
  "Operator": 7
};
const getRank = (pos) => positionRank[pos] || 99;

function getUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}

function normalizeAttendanceResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getInitials(name) {
  if (!name) return "HR";
  return name.split(" ").filter(Boolean).slice(0, 2)
    .map((p) => p[0]?.toUpperCase()).join("");
}

function getAvatarClass(name) {
  const palettes = [
    "bg-blue-100 text-blue-700",
    "bg-indigo-100 text-indigo-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-pink-100 text-pink-700",
  ];
  const i = (name ?? "").split("").reduce((s, c) => s + c.charCodeAt(0), 0) % palettes.length;
  return palettes[i];
}

function formatDateFull(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "short", year: "numeric" });
}

function formatDateShort(dateStr) {
  if (!dateStr) return "-";
  // format YYYYMMDD for display like "20260730"
  if (/^\d{8}$/.test(dateStr)) return dateStr;
  // format YYYY-MM-DD
  return dateStr.replace(/-/g, "");
}

function formatTimeOnly(timeValue) {
  if (!timeValue) return "--:--";
  const timePart = timeValue.includes(' ') ? timeValue.split(' ')[1] : timeValue;
  const [hours = "00", minutes = "00"] = timePart.split(":");
  return `${hours}:${minutes}`;
}



// Expand attendance items into IN + OUT table rows


export default function Attendance() {
  useSEO({
    title: "Presensi & Absensi Karyawan",
    description: "Rekapitulasi dan pemantauan kehadiran, absensi, serta jam kerja karyawan ONE Creativa."
  });

  const user = getUser();
  
  const canExport = user && ["super_admin", "manager", "hr"].includes(user.role_name);
  const isKaryawan = user?.role_name === "karyawan" || user?.role_name === "employee";

  const [attendance, setAttendance] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [, setFilterDateStr] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDay, setSelectedDay] = useState(19);

  const [showAllActivities, setShowAllActivities] = useState(false);
  const [insightPeriod, setInsightPeriod] = useState("Minggu Ini");

  // Table-specific
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [appliedStart, setAppliedStart] = useState(today);
  const [appliedEnd, setAppliedEnd] = useState(today);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [tableSearch, setTableSearch] = useState("");
  const [filterDepartemen, setFilterDepartemen] = useState("Semua Departemen");
  const [filterStatus, setFilterStatus] = useState("Semua Status");

  // Detail Modal state
  const [detailModal, setDetailModal] = useState(null);

  // Edit state
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm state
  const [deleteId, setDeleteId] = useState(null);

  const loadAttendance = async () => {
    try {
      const params = isKaryawan ? { employee_id: user?.employee_id || user?.id } : {};
      const res = await axios.get(ATTENDANCE_API_URL, { params });
      setAttendance(normalizeAttendanceResponse(res.data));
      setErrorMessage("");
    } catch {
      setAttendance([]);
      setErrorMessage("Data attendance gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await axios.get("/api/employees.php");
      if (res.data?.data) setTotalEmployees(res.data.data.length);
    } catch { /* Best-effort cleanup or optional browser data. */ }
  };

  useEffect(() => { loadAttendance(); loadEmployees(); }, []);

  const stats = useMemo(() => {
    const todayStr = today;
    const todayLogs = attendance.filter(a => a.date === todayStr);

    let hadirHariIni = 0;
    let terlambat = 0;
    let izinSakit = 0;
    
    todayLogs.forEach(a => {
      if (a.status === 'present') hadirHariIni++;
      else if (a.status === 'late') {
        hadirHariIni++;
        terlambat++;
      }
      else if (['izin', 'sakit', 'leave', 'cuti'].includes(a.status)) izinSakit++;
    });

    const tingkatKehadiran = totalEmployees > 0 ? ((hadirHariIni / totalEmployees) * 100).toFixed(1) : (hadirHariIni > 0 ? 100 : 0);
    
    let totalJamKerja = 0;
    attendance.forEach(a => {
      if (a.check_in && a.check_out) {
        const inDate = new Date(a.date + ' ' + (a.check_in.split(' ')[1] || a.check_in));
        const outDate = new Date(a.date + ' ' + (a.check_out.split(' ')[1] || a.check_out));
        const diffMs = outDate - inDate;
        if(diffMs > 0) totalJamKerja += diffMs / (1000 * 60 * 60);
      }
    });

    return {
      hadirHariIni,
      terlambat,
      izinSakit,
      tingkatKehadiran,
      totalJamKerja: Math.round(totalJamKerja)
    };
  }, [attendance, totalEmployees, today]);

  const chartDataDynamic = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().slice(0,10);
      
      const dayLogs = attendance.filter(a => a.date === dStr);
      let hadir = 0, terlambat = 0, izin = 0, alpha = 0;
      dayLogs.forEach(a => {
        if (a.status === 'present') hadir++;
        else if (a.status === 'late') terlambat++;
        else if (['izin', 'sakit', 'leave', 'cuti'].includes(a.status)) izin++;
        else if (a.status === 'absent' || a.status === 'alpa') alpha++;
      });
      
      const dayName = d.toLocaleDateString("id-ID", { weekday: "short" });
      const dayNum = d.getDate();
      const monthStr = d.toLocaleDateString("id-ID", { month: "short" });
      
      data.push({
        name: `${dayNum} ${monthStr}\n${dayName.substring(0,3)}`,
        Hadir: hadir,
        Terlambat: terlambat,
        Izin: izin,
        Alpha: alpha
      });
    }
    return data;
  }, [attendance]);

  const recentActivitiesDynamic = useMemo(() => {
    const list = [...attendance].sort((a,b) => new Date(b.date + ' ' + (b.check_in || '00:00')) - new Date(a.date + ' ' + (a.check_in || '00:00')));
    const displayList = showAllActivities ? list : list.slice(0, 5);
    return displayList.map(a => {
      const type = a.check_out ? 'Check Out' : (a.check_in ? 'Check In' : 'Izin/Alpa');
      const time = type === 'Check Out' ? formatTimeOnly(a.check_out) : (type === 'Check In' ? formatTimeOnly(a.check_in) : '-');
      const s = a.status === 'present' ? 'Hadir' : a.status === 'late' ? 'Terlambat' : (a.status === 'absent' || a.status === 'alpa' ? 'Alpa' : 'Izin');
      return {
        name: a.name || 'Unknown',
        time,
        status: s,
        type,
        init: getInitials(a.name),
        bg: getAvatarClass(a.name)
      };
    });
  }, [attendance, showAllActivities]);

  const insightFilteredAttendance = useMemo(() => {
    const todayDate = new Date(today);
    return attendance.filter(a => {
       if (!a.date) return false;
       const d = new Date(a.date);
       if (insightPeriod === "Minggu Ini") {
         const diffTime = Math.abs(todayDate - d);
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         return diffDays <= 7;
       } else if (insightPeriod === "Bulan Ini") {
         return d.getMonth() === todayDate.getMonth() && d.getFullYear() === todayDate.getFullYear();
       }
       return true;
    });
  }, [attendance, insightPeriod, today]);

  const insightStats = useMemo(() => {
    let hadir = 0;
    let totalJamKerja = 0;
    insightFilteredAttendance.forEach(a => {
      if (a.status === 'present' || a.status === 'late') hadir++;
      if (a.check_in && a.check_out) {
        const inDate = new Date(a.date + ' ' + (a.check_in.split(' ')[1] || a.check_in));
        const outDate = new Date(a.date + ' ' + (a.check_out.split(' ')[1] || a.check_out));
        const diffMs = outDate - inDate;
        if(diffMs > 0) totalJamKerja += diffMs / (1000 * 60 * 60);
      }
    });
    const tingkatKehadiran = insightFilteredAttendance.length > 0 
       ? ((hadir / insightFilteredAttendance.length) * 100).toFixed(1) 
       : 0;
    return {
      tingkatKehadiran,
      totalJamKerja: Math.round(totalJamKerja)
    };
  }, [insightFilteredAttendance]);

  const bestDepartmentInsight = useMemo(() => {
     const deptCounts = {};
     insightFilteredAttendance.forEach(a => {
        if(!a.department) return;
        if(!deptCounts[a.department]) deptCounts[a.department] = { total: 0, hadir: 0 };
        deptCounts[a.department].total++;
        if(a.status === 'present' || a.status === 'late') deptCounts[a.department].hadir++;
     });
     let best = "-";
     let bestRate = 0;
     for(const [dept, counts] of Object.entries(deptCounts)) {
        if(counts.total > 0) {
           const rate = (counts.hadir / counts.total) * 100;
           if(rate >= bestRate) { bestRate = rate; best = dept; }
        }
     }
     return { name: best, rate: bestRate.toFixed(1) };
  }, [insightFilteredAttendance]);

  // ── Edit handlers ──────────────────────────────────────────────────────
  

  const handleEdit = async () => {
    setEditLoading(true);
    try {
      await axios.put(ATTENDANCE_API_URL, {
        id: editItem.id,
        role: user?.role_name,
        ...editForm,
        late_minutes: Number(editForm.late_minutes),
        overtime_minutes: Number(editForm.overtime_minutes),
      });
      setEditItem(null);
      loadAttendance();
    } catch (err) {
      alert(err.response?.data?.message ?? "Gagal update data absensi.");
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete handler ─────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await axios.delete(ATTENDANCE_API_URL, {
        data: { id: deleteId, role: user?.role_name },
      });
      setDeleteId(null);
      loadAttendance();
    } catch (err) {
      alert(err.response?.data?.message ?? "Gagal hapus data absensi.");
    }
  };

  // ── Table Data ────────────────────────────────────────────────
  const adminFiltered = useMemo(() => {
    let items = attendance;
    if (appliedStart) items = items.filter((i) => i.date >= appliedStart);
    if (appliedEnd)   items = items.filter((i) => i.date <= appliedEnd);
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      items = items.filter((i) =>
        (i.name || "").toLowerCase().includes(q) ||
        (i.date || "").includes(q)
      );
    }
    return items;
  }, [attendance, appliedStart, appliedEnd, tableSearch]);

  

  
  



  const handleExportPDF = () => {
    const doc = new jsPDF("l", "pt", "a4");
    
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text("LAPORAN ABSENSI KARYAWAN — PT. CREATIVA BRIDGING INTERNATIONAL", 40, 40);
    
    const periodLabel = appliedStart && appliedEnd ? `${appliedStart} s/d ${appliedEnd}` : appliedStart ? `Dari ${appliedStart}` : appliedEnd ? `S/d ${appliedEnd}` : "Semua Periode";
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Periode: ${periodLabel}   |   Diekspor: ${new Date().toLocaleDateString("id-ID")}`, 40, 55);

    const sortedData = [...adminFiltered].sort((a, b) => {
      const deptA = a.department || 'Lainnya';
      const deptB = b.department || 'Lainnya';
      if (deptA !== deptB) return deptA.localeCompare(deptB);
      
      const rankA = getRank(a.position);
      const rankB = getRank(b.position);
      if (rankA !== rankB) return rankA - rankB;

      return (a.name || '').localeCompare(b.name || '');
    });

    const headers = [["No", "Jabatan", "NIK", "Nama", "Tgl Absen", "Jam Masuk", "Jam Pulang", "Status"]];
    const body = [];
    
    let currentDept = null;
    let no = 1;

    sortedData.forEach((item) => {
       const dept = item.department || 'Lainnya';
       if (dept !== currentDept) {
          currentDept = dept;
          body.push([{ content: `Departemen: ${dept}`, colSpan: 8, styles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' } }]);
          no = 1;
       }
       body.push([
         no++,
         item.position || "-",
         item.nik || item.employee_code || "-",
         item.name || "-",
         formatDateShort(item.date),
         item.check_in  ? formatTimeOnly(item.check_in)  : "--:--",
         item.check_out ? formatTimeOnly(item.check_out) : "--:--",
         item.status === "present" ? "Hadir" : item.status === "late" ? "Terlambat" : (item.status === 'absent' || item.status === 'alpa' ? 'Alpa' : (item.status || "-"))
       ]);
    });

    doc.autoTable({
      head: headers,
      body: body,
      startY: 70,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 4 },
      columnStyles: { 0: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' }, 7: { halign: 'center' } }
    });

    doc.save(`Laporan_Absensi_${new Date().getTime()}.pdf`);
  };

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    const periodLabel = appliedStart && appliedEnd ? `${appliedStart} s/d ${appliedEnd}` : appliedStart ? `Dari ${appliedStart}` : appliedEnd ? `S/d ${appliedEnd}` : "Semua Periode";
    const headers = ["No", "Jabatan", "NIK", "Nama", "Tgl Absen", "Jam Masuk", "Jam Pulang", "Status"];

    const sortedData = [...adminFiltered].sort((a, b) => {
      const deptA = a.department || 'Lainnya';
      const deptB = b.department || 'Lainnya';
      if (deptA !== deptB) return deptA.localeCompare(deptB);
      const rankA = getRank(a.position);
      const rankB = getRank(b.position);
      if (rankA !== rankB) return rankA - rankB;
      return (a.name || '').localeCompare(b.name || '');
    });

    const sheetData = [
      [`LAPORAN ABSENSI KARYAWAN — PT. CREATIVA BRIDGING INTERNATIONAL`],
      [`Periode: ${periodLabel}   |   Diekspor: ${new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" })}`],
      [],
      headers,
    ];

    let currentDept = null;
    let no = 1;
    let dataRowIdx = 4;
    const mergeDeptRows = [];
    const dataRowsRef = [];

    sortedData.forEach((item) => {
       const dept = item.department || 'Lainnya';
       if (dept !== currentDept) {
          currentDept = dept;
          sheetData.push([`Departemen: ${dept}`, "", "", "", "", "", "", ""]);
          mergeDeptRows.push(dataRowIdx);
          dataRowIdx++;
          no = 1;
       }
       sheetData.push([
         no++,
         item.position || "-",
         item.nik || item.employee_code || "-",
         item.name || "-",
         formatDateShort(item.date),
         item.check_in  ? formatTimeOnly(item.check_in)  : "--:--",
         item.check_out ? formatTimeOnly(item.check_out) : "--:--",
         item.status === "present" ? "Hadir" : item.status === "late" ? "Terlambat" : (item.status === 'absent' || item.status === 'alpa' ? 'Alpa' : (item.status || "-"))
       ]);
       dataRowsRef.push(dataRowIdx);
       dataRowIdx++;
    });

    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const totalCols = headers.length;

    ws["!cols"] = [
      { wch: 5  },  // No
      { wch: 18 },  // Jabatan
      { wch: 14 },  // NIK
      { wch: 28 },  // Nama
      { wch: 15 },  // Tgl Absen
      { wch: 12 },  // Jam Masuk
      { wch: 12 },  // Jam Pulang
      { wch: 14 },  // Status
    ];

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
    ];
    
    mergeDeptRows.forEach((r) => {
       ws["!merges"].push({ s: { r, c: 0 }, e: { r, c: totalCols - 1 } });
    });

    const GREEN = "4CAF50";
    const DARK_GREEN = "388E3C";
    const WHITE = "FFFFFF";
    const BORDER_COLOR = "BDBDBD";
    const borderAll = { top: { style: "thin", color: { rgb: BORDER_COLOR } }, bottom: { style: "thin", color: { rgb: BORDER_COLOR } }, left: { style: "thin", color: { rgb: BORDER_COLOR } }, right: { style: "thin", color: { rgb: BORDER_COLOR } } };

    const setStyle = (r, c, style) => {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (!ws[ref]) ws[ref] = { v: "", t: "s" };
      ws[ref].s = style;
    };

    setStyle(0, 0, { font: { bold: true, sz: 13, color: { rgb: DARK_GREEN } }, alignment: { horizontal: "center", vertical: "center" }, fill: { fgColor: { rgb: "E8F5E9" } } });
    setStyle(1, 0, { font: { sz: 10, color: { rgb: "616161" } }, alignment: { horizontal: "center", vertical: "center" }, fill: { fgColor: { rgb: "F1F8E9" } } });

    for (let c = 0; c < totalCols; c++) {
      setStyle(3, c, { font: { bold: true, sz: 11, color: { rgb: WHITE } }, fill: { fgColor: { rgb: GREEN } }, alignment: { horizontal: "center", vertical: "center" }, border: borderAll });
    }

    mergeDeptRows.forEach((r) => {
      for (let c = 0; c < totalCols; c++) {
        setStyle(r, c, { font: { bold: true, sz: 11 }, fill: { fgColor: { rgb: "F5F5F5" } }, alignment: { horizontal: "left", vertical: "center" }, border: borderAll });
      }
    });

    dataRowsRef.forEach((r, idx) => {
      const isEven = idx % 2 === 0;
      for (let c = 0; c < totalCols; c++) {
        const isCenter = c === 0 || c === 5 || c === 6 || c === 7;
        setStyle(r, c, { font: { sz: 10 }, fill: { fgColor: { rgb: isEven ? WHITE : "FAFAFA" } }, alignment: { horizontal: isCenter ? "center" : "left", vertical: "center" }, border: borderAll });
      }
    });

    ws["!rows"] = [ { hpt: 26 }, { hpt: 18 }, { hpt: 6 }, { hpt: 22 } ];
    XLSX.utils.book_append_sheet(workbook, ws, "Absensi");
    XLSX.writeFile(workbook, `Laporan_Absensi_${new Date().getTime()}.xlsx`);
  };


  // ────────────────────────────────────────────────────────────────────
  return (
    <Layout hideMobileHeader={true} hideBottomNav={false}>
      {errorMessage && <p role="alert" className="m-4 rounded-xl bg-red-50 p-4 text-red-700">{errorMessage}</p>}
      <div className="min-h-full bg-[#f8fafc] pb-12 px-4 md:px-8 pt-6">

        {/* Top Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#1a2b49]">Attendance Records</h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">Laporan dan rekapitulasi data kehadiran karyawan.</p>
        </div>

        {!isKaryawan && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Total Karyawan */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between relative group">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[13px] font-bold text-slate-500 mb-1">Total Karyawan</p>
              <h3 className="text-[28px] font-black text-slate-800 leading-none">{totalEmployees || 0}</h3>
              <p className="text-[12px] text-slate-400 font-medium mt-2">Seluruh karyawan aktif</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 absolute right-4 bottom-5 group-hover:text-blue-500 transition-colors" />
          </div>

          {/* Hadir Hari Ini */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between relative group">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[13px] font-bold text-slate-500 mb-1">Hadir Hari Ini</p>
              <h3 className="text-[28px] font-black text-slate-800 leading-none">{stats.hadirHariIni}</h3>
              <p className="text-[12px] text-slate-400 font-medium mt-2">{totalEmployees > 0 ? ((stats.hadirHariIni / totalEmployees) * 100).toFixed(1) : 0}% dari total karyawan</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 absolute right-4 bottom-5 group-hover:text-emerald-500 transition-colors" />
          </div>

          {/* Terlambat */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between relative group">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[13px] font-bold text-slate-500 mb-1">Terlambat</p>
              <h3 className="text-[28px] font-black text-slate-800 leading-none">{stats.terlambat}</h3>
              <p className="text-[12px] text-slate-400 font-medium mt-2">{totalEmployees > 0 ? ((stats.terlambat / totalEmployees) * 100).toFixed(1) : 0}% dari total karyawan</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 absolute right-4 bottom-5 group-hover:text-amber-500 transition-colors" />
          </div>

          {/* Izin / Sakit */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between relative group">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FileMinus className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[13px] font-bold text-slate-500 mb-1">Izin / Sakit</p>
              <h3 className="text-[28px] font-black text-slate-800 leading-none">{stats.izinSakit}</h3>
              <p className="text-[12px] text-slate-400 font-medium mt-2">{totalEmployees > 0 ? ((stats.izinSakit / totalEmployees) * 100).toFixed(1) : 0}% dari total karyawan</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 absolute right-4 bottom-5 group-hover:text-purple-500 transition-colors" />
          </div>

          {/* Tingkat Kehadiran */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between relative group">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[13px] font-bold text-slate-500 mb-1">Tingkat Kehadiran</p>
              <h3 className="text-[28px] font-black text-slate-800 leading-none">{stats.tingkatKehadiran}%</h3>
              <p className="text-[12px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Updated
              </p>
            </div>
          </div>
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          {/* Chart */}
          <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-[15px] font-bold text-slate-800 mb-4">Tren Kehadiran 7 Hari Terakhir</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDataDynamic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: '600', bottom: -10 }} />
                  <Line type="monotone" dataKey="Hadir" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Terlambat" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Izin" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Alpha" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ringkasan & Insight */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[15px] font-bold text-slate-800">Ringkasan & Insight</h3>
              <select value={insightPeriod} onChange={e => setInsightPeriod(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 outline-none">
                <option value="Minggu Ini">Minggu Ini</option>
                <option value="Bulan Ini">Bulan Ini</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-4 flex-1">
              <div className="flex items-center gap-4 bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500">Departemen Paling Disiplin</p>
                  <p className="text-[14px] font-black text-slate-800">{bestDepartmentInsight.name}</p>
                  <p className="text-[11px] font-bold text-emerald-500">{bestDepartmentInsight.rate}% tingkat kehadiran</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-2">
                    <Activity className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-500">Rata-rata Kehadiran</p>
                  <p className="text-[18px] font-black text-slate-800">{insightStats.tingkatKehadiran}%</p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center mb-2">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-500">Total Jam Kerja</p>
                  <p className="text-[18px] font-black text-slate-800">{insightStats.totalJamKerja} jam</p>
                </div>
              </div>
            </div>
          </div>

          {/* Aktivitas Kehadiran Terbaru */}
          <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[15px] font-bold text-slate-800">Aktivitas Kehadiran Terbaru</h3>
              <button onClick={() => setShowAllActivities(!showAllActivities)} className="text-[12px] font-bold text-blue-600 hover:underline">
                {showAllActivities ? "Sembunyikan" : "Lihat Semua"}
              </button>
            </div>
            <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {recentActivitiesDynamic.length > 0 ? recentActivitiesDynamic.map((act, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] ${act.bg}`}>
                      {act.init}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-800">{act.name}</p>
                      <p className="text-[11px] font-semibold text-slate-400">{act.type} - {act.time}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                    act.status === 'Hadir' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    act.status === 'Terlambat' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-purple-50 text-purple-600 border border-purple-100'
                  }`}>
                    {act.status}
                  </span>
                </div>
              )) : (
                <div className="text-center py-4 text-slate-500 text-sm">Tidak ada aktivitas terbaru</div>
              )}
            </div>
          </div>
        </div>

          </>
        )}

        {/* Filter & Table Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Filters */}
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-[14px] font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" /> Filter Laporan Kehadiran
            </h3>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                <label className="text-[11px] font-bold text-slate-500">Periode Tanggal</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
                  <span className="text-slate-400 text-[12px] font-bold">-</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
                </div>
              </div>

              {!isKaryawan && (
                <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                  <label className="text-[11px] font-bold text-slate-500">Departemen</label>
                  <select value={filterDepartemen} onChange={(e) => setFilterDepartemen(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition">
                    <option value="Semua Departemen">Semua Departemen</option>
                    <option value="IT & Development">IT & Development</option>
                    <option value="Finance">Finance</option>
                    <option value="HRD">HRD</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operational">Operational</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                <label className="text-[11px] font-bold text-slate-500">Status Kehadiran</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition">
                  <option value="Semua Status">Semua Status</option>
                  <option value="Hadir">Hadir</option>
                  <option value="Terlambat">Terlambat</option>
                  <option value="Izin">Izin</option>
                  <option value="Alpha">Alpha</option>
                </select>
              </div>

              {!isKaryawan && (
                <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                  <label className="text-[11px] font-bold text-slate-500">Cari Karyawan</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" placeholder="Nama, NIK, atau departemen..." value={tableSearch} onChange={(e) => setTableSearch(e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setAppliedStart(startDate); setAppliedEnd(endDate); setCurrentPage(1); }}
                  className="h-9 px-4 rounded-lg bg-[#22c55e] hover:bg-green-600 text-white text-[12px] font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <Search className="w-3.5 h-3.5" /> Cari
                </button>
                <button
                  onClick={() => {
                    setStartDate(today); setEndDate(today);
                    setAppliedStart(""); setAppliedEnd("");
                    setTableSearch(""); setFilterDepartemen("Semua Departemen"); setFilterStatus("Semua Status"); setCurrentPage(1);
                  }}
                  className="h-9 px-4 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-bold hover:bg-slate-50 transition active:scale-95"
                >
                  Reset
                </button>
              </div>
            </div>
            
            {canExport && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                <button onClick={handleExportPDF} className="h-9 px-4 flex items-center gap-1.5 rounded-lg bg-[#1e293b] hover:bg-[#0f172a] text-white text-[12px] font-bold transition active:scale-95 shadow-sm">
                  <FileDown className="w-3.5 h-3.5" /> Export PDF
                </button>
                <button onClick={handleExportExcel} className="h-9 px-4 flex items-center gap-1.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white text-[12px] font-bold transition active:scale-95 shadow-sm">
                  <FileText className="w-3.5 h-3.5" /> Export Excel
                </button>
              </div>
            )}
          </div>

          {/* Table Area */}
          <div className="p-5">
            <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2 mb-4">
               <History className="w-4 h-4 text-slate-500" /> Data Laporan Kehadiran
            </h3>
            
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 text-[12px] text-slate-500 font-semibold">
                <span>Show</span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="border border-slate-200 rounded-md px-2 py-1 bg-white text-[12px] font-bold text-slate-700 outline-none focus:border-blue-400">
                  {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>entries</span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Cari dalam tabel..." value={tableSearch} onChange={(e) => { setTableSearch(e.target.value); setCurrentPage(1); }}
                  className="border border-slate-200 rounded-md pl-8 pr-3 py-1.5 bg-white text-[12px] font-semibold text-slate-700 outline-none focus:border-blue-400 w-48 transition focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>

            {/* MOBILE CARDS (Hidden on Desktop) */}
            <div className="md:hidden flex flex-col gap-4 mt-4">
              {isLoading ? (
                <div className="py-12 text-center text-slate-500">Memuat data...</div>
              ) : adminFiltered.length === 0 ? (
                <div className="py-12 text-center text-slate-500">Tidak ada data absensi</div>
              ) : (
                adminFiltered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((row, idx) => (
                  <div key={idx} className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[14px] font-black text-slate-800">{row.name || "-"}</p>
                        <p className="text-[12px] font-semibold text-slate-500">{row.nik || row.employee_code || "-"}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${row.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {row.status === 'present' ? 'Hadir' : row.status === 'late' ? 'Terlambat' : row.status || 'Hadir'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px]">
                      <div>
                        <p className="font-bold text-slate-400 uppercase mb-0.5">Departemen</p>
                        <p className="font-bold text-slate-700 truncate">{row.department || row.nama_seksi || "-"}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-400 uppercase mb-0.5">Tanggal</p>
                        <p className="font-bold text-slate-700">{formatDateShort(row.date)}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-400 uppercase mb-0.5">Check In</p>
                        <p className="font-bold text-slate-700">{row.check_in ? formatTimeOnly(row.check_in) : '-'}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-400 uppercase mb-0.5">Check Out</p>
                        <p className="font-bold text-slate-700">{row.check_out ? formatTimeOnly(row.check_out) : '-'}</p>
                      </div>
                      <div className="col-span-2 mt-1">
                        <p className="font-bold text-slate-400 uppercase mb-0.5">Jam Kerja</p>
                        <p className="font-bold text-slate-700">
                          {row.working_minutes > 0 ? `${Math.floor(row.working_minutes / 60)}j ${row.working_minutes % 60}m` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* DESKTOP TABLE (Hidden on Mobile) */}
            <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-xl mt-4">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-[#65a30d] text-white">
                    <th className="px-3 py-3 text-left font-bold border-b border-green-600 whitespace-nowrap">No</th>
                    <th className="px-3 py-3 text-left font-bold border-b border-green-600 whitespace-nowrap cursor-pointer">Nama Karyawan ⇅</th>
                    <th className="px-3 py-3 text-left font-bold border-b border-green-600 whitespace-nowrap">NIK</th>
                    <th className="px-3 py-3 text-left font-bold border-b border-green-600 whitespace-nowrap cursor-pointer">Departemen ⇅</th>
                    <th className="px-3 py-3 text-left font-bold border-b border-green-600 whitespace-nowrap cursor-pointer">Tanggal ⇅</th>
                    <th className="px-3 py-3 text-left font-bold border-b border-green-600 whitespace-nowrap">Check In</th>
                    <th className="px-3 py-3 text-left font-bold border-b border-green-600 whitespace-nowrap">Check Out</th>
                    <th className="px-3 py-3 text-left font-bold border-b border-green-600 whitespace-nowrap cursor-pointer">Jam Kerja ⇅</th>
                    <th className="px-3 py-3 text-center font-bold border-b border-green-600 whitespace-nowrap">Status</th>
                    <th className="px-3 py-3 text-center font-bold border-b border-green-600 whitespace-nowrap cursor-pointer">Terlambat (Menit) ⇅</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">Memuat data...</td>
                    </tr>
                  ) : adminFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">Tidak ada data absensi</td>
                    </tr>
                  ) : (
                    adminFiltered.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((row, idx) => {
                      const isEven = idx % 2 === 0;
                      return (
                        <tr key={idx} className={`border-b border-slate-100 hover:bg-slate-50 transition ${isEven ? 'bg-white' : 'bg-slate-50/30'}`}>
                          <td className="px-3 py-2.5 text-slate-600">{(currentPage - 1) * pageSize + idx + 1}</td>
                          <td className="px-3 py-2.5 font-bold text-slate-800">{row.name || "-"}</td>
                          <td className="px-3 py-2.5 text-slate-600">{row.nik || row.employee_code || "-"}</td>
                          <td className="px-3 py-2.5 text-slate-600">{row.department || row.nama_seksi || "-"}</td>
                          <td className="px-3 py-2.5 text-slate-600">{formatDateShort(row.date)}</td>
                          <td className="px-3 py-2.5 text-slate-600">{row.check_in ? formatTimeOnly(row.check_in) : '-'}</td>
                          <td className="px-3 py-2.5 text-slate-600">{row.check_out ? formatTimeOnly(row.check_out) : '-'}</td>
                          <td className="px-3 py-2.5 text-slate-600 font-bold">{row.working_minutes > 0 ? `${Math.floor(row.working_minutes / 60)}j ${row.working_minutes % 60}m` : '-'}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] uppercase ${row.status === 'late' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {row.status === 'present' ? 'Hadir' : row.status === 'late' ? 'Terlambat' : row.status || 'Hadir'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-600 font-bold">{row.late_minutes > 0 ? row.late_minutes : 0}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100">
              <p className="text-[11px] md:text-[12px] font-semibold text-slate-500 text-center md:text-left w-full md:w-auto">
                Showing {adminFiltered.length === 0 ? "0 to 0 of 0" : `${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, adminFiltered.length)} of ${adminFiltered.length}`} entries
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="h-8 px-3 rounded-md border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition">
                  Prev
                </button>
                {[1, 2, 3, 4, 5].map((p) => (
                  <button key={p} onClick={() => setCurrentPage(p)}
                    className={`h-8 w-8 rounded-md text-[11px] font-bold transition ${currentPage === p ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    {p}
                  </button>
                ))}
                <span className="text-slate-400 font-bold px-1 text-[11px]">…</span>
                <button className={`h-8 w-8 rounded-md text-[11px] font-bold transition border border-slate-200 text-slate-600 hover:bg-slate-50`}>13</button>
                <button onClick={() => setCurrentPage((p) => p + 1)}
                  className="h-8 px-3 rounded-md border border-slate-200 text-[11px] font-bold text-blue-600 hover:bg-slate-50 transition">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── Modal Edit Attendance (super_admin only) ── */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setEditItem(null)}>
          <div className="w-full sm:w-[450px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-[18px] font-black text-slate-900">Edit Jam Absensi</h3>
              <p className="mt-1 text-[13px] font-semibold text-slate-500">{editItem.name} — {formatDateFull(editItem.date)}</p>
            </div>
            <div className="px-6 py-5 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-2 block text-[13px] font-bold text-slate-700">Check In</span>
                  <input type="time" value={editForm.check_in} onChange={(e) => setEditForm({ ...editForm, check_in: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[14px] font-mono font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[13px] font-bold text-slate-700">Check Out</span>
                  <input type="time" value={editForm.check_out} onChange={(e) => setEditForm({ ...editForm, check_out: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[14px] font-mono font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-2 block text-[13px] font-bold text-slate-700">Menit Telat</span>
                  <input type="number" min="0" value={editForm.late_minutes} onChange={(e) => setEditForm({ ...editForm, late_minutes: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[14px] text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[13px] font-bold text-slate-700">Status</span>
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-[14px] text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white">
                    <option value="present">Tepat Waktu</option>
                    <option value="late">Terlambat</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6 pt-2">
              <button onClick={() => setEditItem(null)}
                className="flex-1 h-12 rounded-2xl border border-slate-200 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition active:scale-95">Batal</button>
              <button onClick={handleEdit} disabled={editLoading}
                className="flex-1 h-12 rounded-2xl bg-blue-600 text-[14px] font-bold text-white hover:bg-blue-700 transition active:scale-95 shadow-[0_8px_20px_rgba(37,99,235,0.3)] disabled:opacity-60 disabled:scale-100">
                {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Konfirmasi Hapus ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
              <Trash2 className="h-8 w-8 text-rose-500" />
            </div>
            <h3 className="mb-2 text-[18px] font-black text-slate-900">Hapus Riwayat?</h3>
            <p className="mb-6 text-[13px] font-semibold text-slate-500 leading-relaxed">
              Data absensi ini akan dihapus permanen dan tidak bisa dikembalikan ke sistem.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 h-12 rounded-2xl border border-slate-200 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition active:scale-95">Batal</button>
              <button onClick={handleDelete}
                className="flex-1 h-12 rounded-2xl bg-rose-600 text-[14px] font-bold text-white hover:bg-rose-700 transition active:scale-95 shadow-[0_8px_20px_rgba(225,29,72,0.3)]">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Detail Lokasi & Foto ── */}
      {detailModal && (() => {
        const type = detailModal.type;
        const item = detailModal.item;
        let regex = type === "in" ? /Face Snapshot:\s*([^\s,]+)/i : /Face Snapshot Out:\s*([^\s,]+)/i;
        const match = item.notes?.match(regex);
        const photoUrl = match && match[1] ? `/api/../${match[1]}` : null;
        const lat = type === "in" ? item.check_in_lat : item.check_out_lat;
        const lng = type === "in" ? item.check_in_lng : item.check_out_lng;
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDetailModal(null)}>
            <div className="w-full max-w-sm rounded-[2rem] bg-white overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-[17px] font-black text-slate-900">Detail Absen {type === "in" ? "Masuk" : "Pulang"}</h3>
                <button onClick={() => setDetailModal(null)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-500">✕</button>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div className="flex justify-between items-center bg-blue-50 p-3 rounded-2xl border border-blue-100">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Waktu</span>
                    <span className="text-[16px] font-black text-blue-900">
                      {formatDateFull(item.date)} - {formatTimeOnly(type === "in" ? item.check_in : item.check_out)}
                    </span>
                  </div>
                  <div className="px-3 py-1 rounded-lg border text-[11px] font-black uppercase bg-emerald-100 text-emerald-700 border-emerald-200">
                    {item.work_type === "WFH" ? "WFH" : "WFO"}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-slate-700 mb-2">Foto Kamera</span>
                  {photoUrl ? (
                    <div className="w-full aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden shadow-inner border border-slate-200 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[13px] font-bold text-slate-400">Gagal memuat foto</span>
                      </div>
                      <img src={photoUrl} alt="Snapshot" className="w-full h-full object-cover absolute inset-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 border-dashed">
                      <span className="text-[13px] font-bold text-slate-400">Tidak ada foto</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col mt-2">
                  <span className="text-[13px] font-bold text-slate-700 mb-2">Lokasi Koordinat Peta</span>
                  {lat && lng ? (
                    <div className="w-full h-40 bg-slate-100 rounded-2xl overflow-hidden shadow-inner border border-slate-200 relative">
                      <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0"
                        src={`https://maps.google.com/maps?q=${lat},${lng}&hl=id&z=15&output=embed`}></iframe>
                      <a href={`https://maps.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer"
                        className="absolute bottom-2 right-2 bg-blue-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg hover:bg-blue-700">Buka di Maps</a>
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 border-dashed">
                      <span className="text-[13px] font-bold text-slate-400">Koordinat tidak tercatat</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Custom Calendar Popup (karyawan only) ── */}
      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowCalendar(false)}>
          <div className="bg-white w-full max-w-[340px] rounded-3xl p-6 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[19px] font-bold text-slate-800 mb-2">Pilih tanggal</h3>
            <div className="bg-[#ffcc00] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg inline-block mb-6 shadow-sm w-full text-center">
              Hanya dapat memilih rentang tanggal 7 hari
            </div>
            {(() => {
              const currentYear = filterMonth ? parseInt(filterMonth.slice(0, 4)) : new Date().getFullYear();
              const currentMonth = filterMonth ? parseInt(filterMonth.slice(5, 7)) : new Date().getMonth() + 1;
              const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
              const displayMonthName = monthNames[currentMonth - 1];
              const handlePrevMonth = () => { let y = currentYear, m = currentMonth - 1; if (m === 0) { m = 12; y--; } setFilterMonth(`${y}-${m.toString().padStart(2, "0")}`); };
              const handleNextMonth = () => { let y = currentYear, m = currentMonth + 1; if (m === 13) { m = 1; y++; } setFilterMonth(`${y}-${m.toString().padStart(2, "0")}`); };
              const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
              const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
              const blanks = Array.from({ length: firstDay }, (_, i) => i);
              const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
              return (
                <>
                  <div className="flex justify-between items-center mb-6 px-1">
                    <span className="text-[15px] font-bold text-slate-800">{displayMonthName} {currentYear}</span>
                    <div className="flex gap-4">
                      <button onClick={handlePrevMonth} className="text-slate-400 hover:text-slate-700 transition"><ChevronLeft className="w-5 h-5" /></button>
                      <button onClick={handleNextMonth} className="text-slate-400 hover:text-slate-700 transition"><ChevronLeft className="w-5 h-5 rotate-180" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 text-center gap-y-4 mb-8">
                    <div className="text-[11px] font-medium text-rose-500 mb-2">SUN</div>
                    <div className="text-[11px] font-medium text-slate-500 mb-2">MON</div>
                    <div className="text-[11px] font-medium text-slate-500 mb-2">TUE</div>
                    <div className="text-[11px] font-medium text-slate-500 mb-2">WED</div>
                    <div className="text-[11px] font-medium text-slate-500 mb-2">THU</div>
                    <div className="text-[11px] font-medium text-[#005a9c] mb-2">FRI</div>
                    <div className="text-[11px] font-medium text-slate-500 mb-2">SAT</div>
                    {blanks.map((b) => <div key={`blank-${b}`}></div>)}
                    {days.map((d) => {
                      const dayOfWeek = (firstDay + d - 1) % 7;
                      const isSunday_ = dayOfWeek === 0;
                      const isSelected = d === selectedDay;
                      let textClass = "text-[14px] font-semibold text-slate-700";
                      if (isSunday_) textClass = "text-[14px] font-semibold text-rose-500";
                      if (isSelected) textClass = "text-[14px] font-semibold text-[#005a9c]";
                      return (
                        <div key={d} className="flex justify-center items-center">
                          <div onClick={() => setSelectedDay(d)}
                            className={`w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition ${isSelected ? "border-[1.5px] border-[#005a9c]" : "hover:bg-slate-100"} ${textClass}`}>
                            {d}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
            <div className="flex gap-4">
              <button onClick={() => setShowCalendar(false)} className="flex-1 py-3 text-rose-600 text-[14px] font-bold">Tutup</button>
              <button onClick={() => {
                const currentYear = filterMonth ? parseInt(filterMonth.slice(0, 4)) : new Date().getFullYear();
                const currentMonth = filterMonth ? parseInt(filterMonth.slice(5, 7)) : new Date().getMonth() + 1;
                const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, "0")}-${selectedDay.toString().padStart(2, "0")}`;
                setFilterDateStr(dateStr); setShowCalendar(false);
              }} className="flex-1 py-3 rounded-full text-white text-[14px] font-bold bg-[#005a9c]">Pilih</button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
