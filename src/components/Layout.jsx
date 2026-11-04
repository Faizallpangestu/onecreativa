import { logoutUser } from "../utils/logoutUser";
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import { Bell, ChevronDown, Menu, Search, HelpCircle, FileText, CreditCard, Clock, AlertTriangle, CheckCircle2, Megaphone } from "lucide-react";

function formatRp(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
}
import logo from "../assets/logo.webp";
import "../styles/finance-theme.css";
import { normalizeRole } from "../utils/roleAccess";

export default function Layout({ children, hideMobileHeader = false, hideBottomNav = false, hideSidebar = false, appearance }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [financeNotifications, setFinanceNotifications] = useState([]);
  const notifRef = useRef(null);
  const notifRefMobile = useRef(null);
  const profileRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const financePath = /^\/(dashboard-finance|menu-finance|buku-transaksi|laporan-keuangan|profit|balance-sheet|transaksi-pemasukan|transaksi-pengeluaran|history-invoice|invoice-penagihan|anggaran|realisasi|salary|reimbursement|finance|bills|vendors|coa|journal|general-ledger|reconciliation|rekening|cashflow|transfer)(\/|$)/;
  const isFinancePage = appearance === "finance" || financePath.test(location.pathname);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (notifRefMobile.current && !notifRefMobile.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetch("/api/lms_announcements.php")
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setAnnouncements(data.data || []);
        }
      })
      .catch(console.error);
  }, []);

  const loadFinanceNotifications = async () => {
    const notifs = [];

    // 1. Tagihan Vendor (Bills) Belum Dibayar
    try {
      const deletedBillIds = JSON.parse(localStorage.getItem("finance_deleted_bill_ids") || "[]");
      const savedBills = localStorage.getItem("finance_bills_data");
      if (savedBills) {
        const bills = JSON.parse(savedBills);
        if (Array.isArray(bills)) {
          const unpaid = bills.filter(b =>
            !deletedBillIds.includes(String(b.id)) &&
            b.status &&
            b.status.toLowerCase().includes("belum")
          );
          unpaid.slice(0, 10).forEach(b => {
            notifs.push({
              id: `bill-${b.id}`,
              type: "bill",
              category: "Tagihan Vendor",
              title: `Tagihan ${b.id} - ${b.vendor || 'Vendor'}`,
              desc: `${formatRp(b.total)} • Status: Belum Dibayar`,
              date: b.jatuhTempo ? `Jatuh tempo: ${b.jatuhTempo}` : (b.tanggal || ""),
              link: "/bills",
              color: "amber"
            });
          });
        }
      }
    } catch (e) { }

    // 2. Invoice Pembayaran Siswa Menunggu Verifikasi & Overdue
    try {
      const res = await fetch("/api/billing.php");
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success" && data.data) {
          const payments = data.data.pembayaran || [];
          const invoices = data.data.invoices || [];

          // Pembayaran butuh verifikasi
          const pending = payments.filter(p =>
            p.statusVerif && (p.statusVerif.toLowerCase() === "menunggu" || p.statusVerif.toLowerCase() === "pending")
          );
          pending.slice(0, 10).forEach(p => {
            notifs.push({
              id: `pay-${p.id || p.noInv}`,
              type: "payment",
              category: "Verifikasi Pembayaran",
              title: `Bukti Bayar Invoice #${p.noInv || p.id}`,
              desc: `${p.customer || 'Siswa'} bayar ${formatRp(p.jumlah)} via ${p.metode || 'Transfer'} (Menunggu Verifikasi)`,
              date: p.tglBayar || "",
              link: "/invoice-penagihan",
              color: "blue"
            });
          });

          // Invoice Overdue
          const overdue = invoices.filter(inv =>
            inv.status && inv.status.toLowerCase() === "overdue"
          );
          overdue.slice(0, 5).forEach(inv => {
            notifs.push({
              id: `inv-${inv.id}`,
              type: "invoice",
              category: "Invoice Jatuh Tempo",
              title: `Invoice #${inv.id} Overdue`,
              desc: `${inv.customer || 'Siswa'} • Sisa: ${formatRp(inv.sisa || inv.total)}`,
              date: inv.jatuhTempo ? `Jatuh tempo: ${inv.jatuhTempo}` : "",
              link: "/invoice-penagihan",
              color: "rose"
            });
          });
        }
      }
    } catch (e) { }

    // 3. Pengajuan Anggaran
    try {
      const savedAnggaran = localStorage.getItem("finance_anggaran_data");
      if (savedAnggaran) {
        const list = JSON.parse(savedAnggaran);
        if (Array.isArray(list)) {
          const pendingAng = list.filter(a =>
            a.status && (a.status.toLowerCase().includes("menunggu") || a.status.toLowerCase() === "pending")
          );
          pendingAng.slice(0, 5).forEach(a => {
            notifs.push({
              id: `ang-${a.id}`,
              type: "budget",
              category: "Pengajuan Anggaran",
              title: `Pengajuan: ${a.kegiatan || a.kategori || a.judul || 'Operasional'}`,
              desc: `Nominal: ${formatRp(a.nominal || a.total)} (Menunggu Approval)`,
              date: a.tanggal || "",
              link: "/anggaran",
              color: "indigo"
            });
          });
        }
      }
    } catch (e) { }

    setFinanceNotifications(notifs);
  };

  useEffect(() => {
    loadFinanceNotifications();
    const interval = setInterval(loadFinanceNotifications, 30000);
    window.addEventListener("storage", loadFinanceNotifications);
    window.addEventListener("finance_bills_updated", loadFinanceNotifications);
    window.addEventListener("finance_invoice_updated", loadFinanceNotifications);
    window.addEventListener("finance_payment_updated", loadFinanceNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", loadFinanceNotifications);
      window.removeEventListener("finance_bills_updated", loadFinanceNotifications);
      window.removeEventListener("finance_invoice_updated", loadFinanceNotifications);
      window.removeEventListener("finance_payment_updated", loadFinanceNotifications);
    };
  }, []);

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  });

  const role = normalizeRole(user?.role_name || user?.role);
  const isSuperAdmin = role === "super_admin" || role === "owner" || role === "director" || role === "direktur";

  useEffect(() => {
    fetch("/api/session.php")
      .then(res => res.json())
      .then(data => {
        if (data.status === "success" && data.actor) {
          const actor = data.actor;
          setUser(prev => {
            const rawName = actor.name || actor.full_name || prev?.name || prev?.full_name || "Muhammad Faizal";
            const cleanName = (rawName.toUpperCase().includes("PT. CREATIVA") || rawName.toUpperCase().includes("BRIDGING"))
              ? (actor.full_name || "Muhammad Faizal")
              : rawName;
            const updated = {
              ...(prev || {}),
              ...actor,
              name: cleanName,
              full_name: actor.full_name || cleanName,
              role_name: actor.role || prev?.role_name || "super_admin",
            };
            try { localStorage.setItem("user", JSON.stringify(updated)); } catch { }
            return updated;
          });
        }
      })
      .catch(() => { });
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;

    const titles = {
      "/dashboard": "Dashboard",
      "/dashboard-siswa-intensif": "Dashboard",
      "/dashboard-sensei": "Dashboard",
      "/dashboard-finance": "Dashboard",
      "/menu-finance": "Finance Creativa",
      "/sensei/barcode": "Presensi Barcode",
      "/sensei/agenda": "Agenda & Schedule",
      "/sensei/tugas": "Tugas",
      "/sensei/quiz": "QUIZ",
      "/sensei/ukom": "UKOM",
      "/sensei/konsultasi": "Konsultasi",
      "/sensei/nilai-siswa": "Nilai Siswa",
      "/sensei/kehadiran": "Kehadiran Siswa",
      "/sensei/leaderboard": "Leaderboard",
      "/sensei/student-management": "Student Management",
      "/lms/profil": "Profil",
      "/lms/presence-code": "Presence Code",
      "/lms/kartu-siswa": "Kartu Siswa",
      "/lms/tagihan": "Tagihan Keuangan",
      "/lms/classes": "Daftar Kelas",
      "/lms/kelas-saya": "Kelas Saya",
      "/lms/kalender": "Kalender Pertemuan",
      "/lms/agenda": "Agenda",
      "/lms/materi": "Materi",
      "/lms/tugas-quiz": "Tugas & Quiz",
      "/lpk-tugas": "Assignments",
      "/lpk-quiz": "Quiz",
      "/lpk-absensi-sensei": "Instructor Attendance",
      "/lpk-absensi-siswa": "Student Attendance",
      "/lpk-intensif": "Student Management",
      "/lms/siswa": "Student Management",
      "/lpk-nilai": "Grades & Scores",
      "/lms/leaderboard": "Papan Peringkat",
      "/lms/instructor": "Instructor",
      "/lms/pengumuman": "Pengumuman",
      "/lms/kalender-n5": "Calendar N5",
      "/lms/kalender-n4": "Calendar N4",
      "/lms/tugas": "Tugas",
      "/lms/quiz": "Quiz",
      "/lms/ukom": "Ujian Kompetensi",
      "/lms/konsultasi": "Konsultasi",
      "/lms/diskusi": "Diskusi",
      "/lms/nilai": "Nilai",
      "/lms/latihan-kaiwa": "Latihan Kaiwa Online",
      "/lms/kotoba": "Kotoba",
      "/lms/absensi": "Attendance",
      "/employees": "Manage Employees",
      "/positions": "Position Master",
      "/attendance": "Attendance Records",
      "/leaves": "Leave Requests",
      "/payroll-hrd": "Payroll Calculation",
      "/daily-report-admin": "Work Reports",
      "/overtime": "Overtime",
      "/face-clock": "Face Attendance",
      "/assets": "Asset Data",
      "/assets/laporan": "Asset Report",
      "/assets/audit": "Audit Report",
      "/assets/approval": "Asset Approval",
      "/assets/maintenance": "Maintenance",
      "/assets/scan": "Scan QR Asset",
      "/profit": "Finance & Profit",
      "/balance-sheet": "Balance Sheet (Neraca)",
      "/transaksi-pemasukan": "Income Transactions",
      "/transaksi-pengeluaran": "Expense Transactions",
      "/invoice-penagihan": "Invoice",
      "/bills": "Bills (Tagihan Vendor)",
      "/buku-transaksi": "Audit Trail & Rekam Jejak Forensik",
      "/audit-trail": "Audit Trail & Rekam Jejak Forensik",
      "/coa": "Chart of Accounts (COA)",
      "/journal": "Journal Akuntansi",
      "/general-ledger": "General Ledger",
      "/reconciliation": "Bank Reconciliation",
      "/rekening": "Data Rekening Kas & Bank",
      "/cashflow": "Laporan Cash Flow",
      "/transfer": "Transfer Dana",
      "/finance/student-billing": "Students & Billing",
      "/anggaran": "Budgeting",
      "/salary": "Penggajian Karyawan",
      "/reimbursement": "Reimbursement",
      "/access-rights-sensei": "Hak Akses Sensei LMS",
      "/access-rights-siswa": "Hak Akses Siswa LMS",
      "/matching-job": "Matching Job",
      "/nenkin": "Nenkin",
      "/settings": "System Settings",
      "/location-settings": "Location Settings",
      "/access-rights": "Hak Akses",
      "/access-rights-ga": "Hak Akses GA",
      "/access-rights-hr": "Hak Akses HRD & Admin",
      "/access-rights-finance": "Hak Akses Finance"
    };

    // Find exact match first
    if (titles[path]) return titles[path];

    // Find best prefix match (for sub-routes like /lms/agenda/123)
    let bestMatch = "Dashboard";
    let maxLen = 0;
    for (const [key, val] of Object.entries(titles)) {
      if (path.startsWith(key) && key.length > maxLen) {
        bestMatch = val;
        maxLen = key.length;
      }
    }

    return bestMatch;
  };

  const totalNotifications = financeNotifications.length + announcements.length;

  const renderNotificationDropdown = (isMobile = false) => (
    <div className={`absolute right-0 ${isMobile ? 'mt-2 w-72' : 'mt-3 w-84 md:w-96'} bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150`}>
      <div className="p-3.5 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-xs md:text-sm">Notifikasi Keuangan & Sistem</h3>
        <span className={`text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full ${totalNotifications > 0 ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"
          }`}>
          {totalNotifications} Baru
        </span>
      </div>

      <div className={`${isMobile ? 'max-h-64' : 'max-h-96'} overflow-y-auto divide-y divide-slate-100`}>
        {totalNotifications === 0 ? (
          <div className="p-6 md:p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-700">Semua Beres!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada tagihan atau pembayaran yang menunggu.</p>
          </div>
        ) : (
          <>
            {financeNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setShowNotifications(false);
                  if (item.link) navigate(item.link);
                }}
                className="p-3 hover:bg-slate-50 transition cursor-pointer flex gap-3 items-start group"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.color === 'rose' ? 'bg-rose-50 text-rose-600' :
                    item.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                      item.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                        item.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                          'bg-emerald-50 text-emerald-600'
                  }`}>
                  {item.type === 'bill' ? <AlertTriangle className="w-4 h-4" /> :
                    item.type === 'payment' ? <CreditCard className="w-4 h-4" /> :
                      item.type === 'invoice' ? <FileText className="w-4 h-4" /> :
                        item.type === 'budget' ? <Clock className="w-4 h-4" /> :
                          <Bell className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${item.color === 'rose' ? 'bg-rose-100/70 text-rose-700' :
                        item.color === 'amber' ? 'bg-amber-100/70 text-amber-800' :
                          item.color === 'blue' ? 'bg-blue-100/70 text-blue-700' :
                            item.color === 'indigo' ? 'bg-indigo-100/70 text-indigo-700' :
                              'bg-slate-100 text-slate-600'
                      }`}>
                      {item.category}
                    </span>
                    {item.date && (
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {item.date}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}

            {announcements.map((item, idx) => (
              <div
                key={`ann-${idx}`}
                onClick={() => setShowNotifications(false)}
                className="p-3 hover:bg-slate-50 transition cursor-pointer flex gap-3 items-start group"
              >
                <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded">
                      Pengumuman
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : ""}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                    {item.content}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {totalNotifications > 0 && (
        <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
          <span className="text-[11px] font-semibold text-slate-500">
            Klik notifikasi untuk membuka transaksi / dokumen terkait
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans ${isFinancePage ? "finance-dashboard-shell" : ""}`}>

      {!hideSidebar && (
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} appearance={isFinancePage ? "finance" : undefined} />
      )}

      <div className="flex flex-col flex-1 h-full relative w-full overflow-hidden">

        {/* Desktop Top Bar (Hidden on Mobile) */}
        {/* Desktop Top Bar (Hidden on Mobile) */}
        {isFinancePage ? (
          <header className="finance-topbar hidden md:flex shrink-0 items-center justify-between bg-white px-7 h-[68px] z-10 border-b border-slate-200 is-finance">
            <div className="flex items-center gap-4">
              <button
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                aria-label="Toggle navigasi"
                onClick={() => setIsSidebarOpen(prev => !prev)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex flex-col">
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  {({
                    "/dashboard-finance": "Dashboard",
                    "/invoice-penagihan": "Invoice",
                    "/buku-transaksi": "Audit Trail Forensik",
                    "/audit-trail": "Audit Trail Forensik",
                    "/laporan-keuangan": "Laporan Keuangan",
                    "/profit": "Profit & Loss",
                    "/balance-sheet": "Balance Sheet",
                    "/transaksi-pemasukan": "Transaksi Pemasukan",
                    "/transaksi-pengeluaran": "Transaksi Pengeluaran",
                    "/anggaran": "Anggaran",
                    "/realisasi": "Realisasi Anggaran",
                    "/salary": "Penggajian Karyawan",
                    "/reimbursement": "Reimbursement",
                    "/settings": "Pengaturan Sistem",
                  }[location.pathname] || getPageTitle() || "Dashboard")}
                </h1>
                <div className="text-xs text-slate-400 font-normal leading-tight mt-0.5">
                  <span 
                    onClick={() => navigate(isSuperAdmin ? "/dashboard" : "/dashboard-finance")}
                    className="hover:text-blue-600 cursor-pointer transition-colors"
                  >
                    {isSuperAdmin ? "Super Admin" : "Keuangan"}
                  </span>
                  {" > "}
                  <span>
                    {({
                      "/dashboard-finance": "Dashboard Keuangan",
                      "/invoice-penagihan": "Invoice",
                      "/finance/student-billing": "Students",
                      "/buku-transaksi": "Audit Trail Forensik",
                      "/audit-trail": "Audit Trail Forensik",
                      "/laporan-keuangan": "Laporan Keuangan",
                      "/profit": "Profit & Loss",
                      "/balance-sheet": "Balance Sheet",
                      "/transaksi-pemasukan": "Transaksi Pemasukan",
                      "/transaksi-pengeluaran": "Transaksi Pengeluaran",
                      "/anggaran": "Anggaran",
                      "/realisasi": "Realisasi Anggaran",
                      "/salary": "Penggajian Karyawan",
                      "/reimbursement": "Reimbursement",
                      "/settings": "Pengaturan Sistem",
                    }[location.pathname] || getPageTitle() || "Dashboard Keuangan")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search Bar with Ctrl + K */}
              <div className="relative hidden xl:flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari transaksi, pihak, rekening..."
                  className="pl-9 pr-14 py-2 w-72 lg:w-80 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">Ctrl + K</kbd>
              </div>

              {/* Help button */}
              <button className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-2 rounded-full transition-colors" title="Bantuan">
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* Notifications with dynamic badge */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-2 rounded-full relative transition-colors"
                  title="Notifikasi Keuangan & Sistem"
                >
                  <Bell className="w-5 h-5" />
                  {totalNotifications > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                      {totalNotifications > 99 ? "99+" : totalNotifications}
                    </span>
                  )}
                </button>

                {showNotifications && renderNotificationDropdown(false)}
              </div>

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                <div
                  className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-1 rounded-xl transition-colors"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  {(() => {
                    const photoName = user?.photo || user?.photo_url;
                    const intensifName = user?.foto_profil;
                    const photoUrl = photoName && photoName !== "null" 
                      ? `/api/upload_photo.php?view=photo&file=${encodeURIComponent(photoName)}` 
                      : intensifName && intensifName !== "null" 
                        ? `/uploads/intensif/${intensifName}` 
                        : null;
                        
                    const rawName = user?.name || user?.full_name || "Administrator";
                    const cleanName = (rawName.toUpperCase().includes("PT. CREATIVA") || rawName.toUpperCase().includes("BRIDGING"))
                      ? (user?.full_name || "Muhammad Faizal")
                      : rawName;
                    const fallbackInitial = (cleanName[0] || "A").toUpperCase();
                    
                    return (
                      <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-[#1a73e8] flex items-center justify-center text-white font-bold text-sm shadow-2xs shrink-0">
                        {photoUrl ? (
                          <img 
                            src={photoUrl} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 flex items-center justify-center" style={{ display: photoUrl ? 'none' : 'flex' }}>
                          {fallbackInitial}
                        </div>
                      </div>
                    );
                  })()}
                  {(() => {
                    const r = String(user?.role_name || user?.role || '').toLowerCase();
                    const roleLabel = (r === 'super_admin' || r === 'owner' || r === 'director' || r === 'direktur') ? 'Super Admin' :
                      r === 'admin' ? 'Administrator' :
                      (r === 'hr' || r === 'hrd' || r === 'hr_admin') ? 'HRD' :
                      r === 'ga' ? 'General Affair' :
                      (r === 'finance' || r === 'finance_admin') ? 'Finance' :
                      r === 'lpk' ? 'LPK Admin' :
                      (r === 'sensei' || r === 'sensei_intensif') ? 'Sensei' :
                      (r.startsWith('peserta_') || r === 'siswa') ? 'Siswa' :
                      ((r === '' || r === 'employee' || r === 'karyawan') && user?.position ? user.position : (user?.role_name || 'Staff'));

                    const rawName = user?.name || user?.full_name || "Administrator";
                    const displayName = (rawName.toUpperCase().includes("PT. CREATIVA") || rawName.toUpperCase().includes("BRIDGING"))
                      ? (user?.full_name || "Muhammad Faizal")
                      : rawName;

                    return (
                      <div className="hidden lg:flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wide leading-tight">
                          {displayName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                          {roleLabel}
                        </span>
                      </div>
                    );
                  })()}
                  <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                </div>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-soft border border-slate-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="text-sm font-bold text-slate-800">Email Account</p>
                      <p className="text-xs text-slate-500 font-medium truncate">{user?.email || "admin@creativa.com"}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/account-settings');
                      }}
                      className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      My Profile
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      onClick={async () => {
                        await logoutUser();
                        localStorage.removeItem('token');
                        window.location.href = '/';
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        ) : (
          <header className={`finance-topbar hidden md:flex shrink-0 items-center justify-between bg-white/80 backdrop-blur-lg px-8 h-[72px] z-10 border-b border-slate-200`}>
            <div className="font-bold text-slate-900 tracking-wide text-base lg:text-lg flex items-center gap-3">
              <button
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                aria-label="Toggle navigasi"
                onClick={() => setIsSidebarOpen(prev => !prev)}
              >
                <Menu className="w-5 h-5" />
              </button>
              {getPageTitle()}
            </div>

            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 border border-slate-200 bg-white rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-slate-700">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 17h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Guide
              </button>
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="text-slate-400 hover:text-navy-900 relative p-2 rounded-full hover:bg-slate-100 transition-colors"
                  title="Notifikasi"
                >
                  <Bell className="w-5 h-5" />
                  {totalNotifications > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                      {totalNotifications > 99 ? "99+" : totalNotifications}
                    </span>
                  )}
                </button>

                {showNotifications && renderNotificationDropdown(false)}
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="relative" ref={profileRef}>
                <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <div className="flex items-center gap-1">
                    {(() => {
                      const photoName = user?.photo || user?.photo_url;
                      const intensifName = user?.foto_profil;
                      const photoUrl = photoName && photoName !== "null"
                        ? `/api/upload_photo.php?view=photo&file=${encodeURIComponent(photoName)}`
                        : intensifName && intensifName !== "null"
                          ? `/uploads/intensif/${intensifName}`
                          : null;

                      const rawName = user?.name || user?.full_name || "Admin";
                      const cleanName = (rawName.toUpperCase().includes("PT. CREATIVA") || rawName.toUpperCase().includes("BRIDGING"))
                        ? (user?.full_name || "Muhammad Faizal")
                        : rawName;
                      const fallbackInitial = (cleanName[0] || "M").toUpperCase();

                      return (
                        <div className="relative w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-royal-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt="Profile"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="absolute inset-0 flex items-center justify-center" style={{ display: photoUrl ? 'none' : 'flex' }}>
                            {fallbackInitial}
                          </div>
                        </div>
                      );
                    })()}
                    {(() => {
                      const r = String(user?.role_name || user?.role || '').toLowerCase();
                      const roleLabel = (r === 'super_admin' || r === 'owner') ? 'Super Admin' :
                        r === 'admin' ? 'Administrator' :
                          (r === 'hr' || r === 'hrd' || r === 'hr_admin') ? 'HRD' :
                            r === 'ga' ? 'General Affair' :
                              (r === 'finance' || r === 'finance_admin') ? 'Finance' :
                                r === 'lpk' ? 'LPK Admin' :
                                  (r === 'sensei' || r === 'sensei_intensif') ? 'Sensei' :
                                    (r.startsWith('peserta_') || r === 'siswa') ? 'Siswa' :
                                      ((r === '' || r === 'employee' || r === 'karyawan') && user?.position ? user.position : (user?.role_name || 'Staff'));

                      const rawName = user?.name || user?.full_name || "Muhammad Faizal";
                      const displayName = (rawName.toUpperCase().includes("PT. CREATIVA") || rawName.toUpperCase().includes("BRIDGING"))
                        ? (user?.full_name || "Muhammad Faizal")
                        : rawName;

                      return (
                        <div className="hidden lg:flex flex-col ml-2 mr-1 text-right">
                          <span className="text-sm font-semibold text-slate-800 leading-tight">
                            {displayName}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {roleLabel}
                          </span>
                        </div>
                      );
                    })()}
                    <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-soft border border-slate-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="text-sm font-bold text-slate-800">Email Account</p>
                      <p className="text-xs text-slate-500 font-medium truncate">{user?.email || "admin@creativa.com"}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/account-settings');
                      }}
                      className="w-full text-left px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      My Profile
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                      onClick={async () => {
                        await logoutUser();
                        localStorage.removeItem('token');
                        window.location.href = '/';
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Mobile Header (Hidden on Desktop & Tablet) */}
        {(!hideMobileHeader || isFinancePage) && (
          <header className="flex md:hidden shrink-0 items-center justify-between bg-white px-4 py-3 shadow-sm z-10 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {isFinancePage ? <div className="finance-mobile-brand flex items-center gap-2"><img className="w-[35px] h-[35px] object-contain rounded-full" src={logo} alt="Logo LPK Creativa" /><span className="text-[9px] leading-[1.45] text-navy-900 font-bold">LPK CREATIVA<br />BRIDGING INTERNATIONAL</span></div> : <span className="text-base font-bold text-navy-900 tracking-wide">{getPageTitle()}</span>}
            </div>
            <div className="flex items-center gap-3">
              {!hideSidebar && <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Buka navigasi" onClick={() => setIsSidebarOpen(true)}><Menu className="w-5 h-5" /></button>}
              <div className="relative" ref={notifRefMobile}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="text-slate-400 relative p-1.5"
                  title="Notifikasi"
                >
                  <Bell className="w-5 h-5" />
                  {totalNotifications > 0 && (
                    <span className="absolute top-0 right-0 min-w-[16px] h-[16px] px-1 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                      {totalNotifications > 99 ? "99+" : totalNotifications}
                    </span>
                  )}
                </button>
                {showNotifications && renderNotificationDropdown(true)}
              </div>
              <div className="w-8 h-8 rounded-full bg-royal-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {(user?.name?.[0] || user?.email?.[0] || "A").toUpperCase()}
              </div>
            </div>
          </header>
        )}

        <main className={`finance-layout-content flex-1 overflow-y-auto w-full p-4 md:p-6 lg:p-8 bg-slate-50 pb-24 md:pb-8 ${isFinancePage ? "is-finance" : ""}`}>
          {children}
        </main>

        {/* Mobile Bottom Navigation (Selalu tampil di mobile) */}
        {!hideBottomNav && <BottomNav appearance={isFinancePage ? "finance" : appearance} onOpenMenu={() => setIsSidebarOpen(true)} />}
      </div>
    </div>
  );
}


