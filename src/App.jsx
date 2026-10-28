import "./services/sessionHeaders";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import GlobalLoading from "./components/GlobalLoading";
import ErrorBoundary from "./components/ErrorBoundary";
import RouteMetadata from "./components/RouteMetadata";

// Lazy Loaded Pages
import Login from "./pages/Login";
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Employees = lazy(() => import("./pages/Employees"));
const AccessRights = lazy(() => import("./pages/AccessRights"));
const AssignRFID = lazy(() => import("./pages/AssignRFID"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Payroll = lazy(() => import("./pages/Payroll"));
const Overtime = lazy(() => import("./pages/Overtime"));
const Leaves = lazy(() => import("./pages/Leaves"));
const Settings = lazy(() => import("./pages/Settings"));
const Positions = lazy(() => import("./pages/Positions"));
const FaceEnrollment = lazy(() => import("./pages/FaceEnrollment"));
const FaceClock = lazy(() => import("./pages/FaceClock"));
const LocationSettings = lazy(() => import("./pages/LocationSettings"));
const Profit = lazy(() => import("./pages/Profit"));
const FinanceWorkspace = lazy(() => import("./pages/FinanceWorkspace"));
const Reimbursement = lazy(() => import("./pages/Reimbursement"));
const DashboardFinance = lazy(() => import("./pages/DashboardFinance"));
const TransaksiPemasukan = lazy(() => import("./pages/TransaksiPemasukan"));
const TransaksiPengeluaran = lazy(() => import("./pages/TransaksiPengeluaran"));
const HistoryInvoice = lazy(() => import("./pages/HistoryInvoice"));
const InvoicePenagihan = lazy(() => import("./pages/InvoicePenagihan"));
const AnggaranBiaya = lazy(() => import("./pages/AnggaranBiaya"));
const SalaryKaryawan = lazy(() => import("./pages/SalaryKaryawan"));
const PayrollHRD = lazy(() => import("./pages/PayrollHRD"));
const SlipGajiKaryawan = lazy(() => import("./pages/SlipGajiKaryawan"));
const DailyReportKaryawan = lazy(() => import("./pages/DailyReportKaryawan"));
const DailyReportAdmin = lazy(() => import("./pages/DailyReportAdmin"));
const StravaIntegration = lazy(() => import("./pages/StravaIntegration"));
const StravaAdmin = lazy(() => import("./pages/StravaAdmin"));

// Finance Modular Pages
const BillsPage = lazy(() => import("./pages/finance/BillsPage"));
const VendorsPage = lazy(() => import("./pages/finance/VendorsPage"));
const BukuTransaksiPage = lazy(() => import("./pages/finance/BukuTransaksiPage"));
const CoaPage = lazy(() => import("./pages/finance/CoaPage"));
const JournalPage = lazy(() => import("./pages/finance/JournalPage"));
const GeneralLedgerPage = lazy(() => import("./pages/finance/GeneralLedgerPage"));
const ReconciliationPage = lazy(() => import("./pages/finance/ReconciliationPage"));
const RekeningPage = lazy(() => import("./pages/finance/RekeningPage"));
const CashflowPage = lazy(() => import("./pages/finance/CashflowPage"));
const TransferPage = lazy(() => import("./pages/finance/TransferPage"));

// LPK Creativa
const MatchingJob = lazy(() => import("./pages/MatchingJob"));
const LpkNenkin = lazy(() => import("./pages/LpkNenkin"));
const LpkAlumni = lazy(() => import("./pages/LpkAlumni"));
const LpkIntensif = lazy(() => import("./pages/LpkIntensif"));
const LpkMagang = lazy(() => import("./pages/LpkMagang"));
const DashboardCreativa = lazy(() => import("./pages/DashboardCreativa"));
const DashboardPesertaNenkin = lazy(() => import("./pages/DashboardPesertaNenkin"));
const DashboardPesertaIntensif = lazy(() => import("./pages/DashboardPesertaIntensif"));
const DashboardPesertaMatching = lazy(() => import("./pages/DashboardPesertaMatching"));
const DashboardPesertaMendang = lazy(() => import("./pages/DashboardPesertaMendang"));
const DashboardPesertaAlumni = lazy(() => import("./pages/DashboardPesertaAlumni"));
const AccessRightsLPK = lazy(() => import("./pages/AccessRightsLPK"));
const LpkAttendance = lazy(() => import("./pages/LpkAttendance"));
const LpkNilai = lazy(() => import("./pages/LpkNilai"));
const LpkTugas = lazy(() => import("./pages/LpkTugas"));
const LpkQuiz = lazy(() => import("./pages/LpkQuiz"));
const LpkMateri = lazy(() => import("./pages/LpkMateri"));

// LMS Siswa Intensif
const DashboardSiswaIntensif = lazy(() => import("./pages/DashboardSiswaIntensif"));
const LearningClasses = lazy(() => import("./pages/LearningClasses"));
const StudentBillingAdmin = lazy(() => import("./pages/StudentBillingAdmin"));
const LmsDashboard = lazy(() => import("./pages/lms/LmsDashboard"));
const LmsKalender = lazy(() => import("./pages/lms/LmsKalender"));
const LmsAdminAgenda = lazy(() => import("./pages/lms/LmsAdminAgenda"));
const LmsMateri = lazy(() => import("./pages/lms/LmsMateri"));
const LmsTugas = lazy(() => import("./pages/lms/LmsTugas"));
const LmsQuiz = lazy(() => import("./pages/lms/LmsQuiz"));
const LmsNilai = lazy(() => import("./pages/lms/LmsNilai"));
const LmsBelajar = lazy(() => import("./pages/lms/LmsBelajar"));
const LmsAbsensi = lazy(() => import("./pages/lms/LmsAbsensi"));
const LmsLeaderboard = lazy(() => import("./pages/lms/LmsLeaderboard"));
const LmsLatihanKaiwa = lazy(() => import("./pages/lms/LmsLatihanKaiwa"));
const LmsInstructor = lazy(() => import("./pages/lms/LmsInstructor"));
const LmsCalendar = lazy(() => import("./pages/lms/LmsCalendar"));
const LmsPengumuman = lazy(() => import("./pages/lms/LmsPengumuman"));
const LmsProfil = lazy(() => import("./pages/lms/LmsProfil"));
const LmsKartuSiswa = lazy(() => import("./pages/lms/LmsKartuSiswa"));
const LmsTagihan = lazy(() => import("./pages/lms/LmsTagihan"));
const LmsUkom = lazy(() => import("./pages/lms/LmsUkom"));
const LmsKonsultasi = lazy(() => import("./pages/lms/LmsKonsultasi"));
const LmsTugasQuiz = lazy(() => import("./pages/lms/LmsTugasQuiz"));
const LmsDiskusi = lazy(() => import("./pages/lms/LmsDiskusi"));
const LmsKelasSaya = lazy(() => import("./pages/lms/LmsKelasSaya"));
const LmsKotoba = lazy(() => import("./pages/lms/LmsKotoba"));
const PresenceCode = lazy(() => import("./pages/lms/PresenceCode"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));

// Sensei
const DashboardSensei = lazy(() => import("./pages/DashboardSensei"));
const SenseiBarcode = lazy(() => import("./pages/sensei/SenseiBarcode"));
const SenseiAgenda = lazy(() => import("./pages/sensei/SenseiAgenda"));
const SenseiMateri = lazy(() => import("./pages/sensei/SenseiMateri"));
const SenseiTugas = lazy(() => import("./pages/sensei/SenseiTugas"));
const SenseiQuiz = lazy(() => import("./pages/sensei/SenseiQuiz"));
const SenseiUkom = lazy(() => import("./pages/sensei/SenseiUkom"));
const SenseiKonsultasi = lazy(() => import("./pages/sensei/SenseiKonsultasi"));
const SenseiNilaiSiswa = lazy(() => import("./pages/sensei/SenseiNilaiSiswa"));
const SenseiKehadiran = lazy(() => import("./pages/sensei/SenseiKehadiran"));
const SenseiLeaderboard = lazy(() => import("./pages/sensei/SenseiLeaderboard"));

const MenuKaryawan = lazy(() => import("./pages/MenuKaryawan"));
const MenuHRD = lazy(() => import("./pages/MenuHRD"));
const MenuAdmin = lazy(() => import("./pages/MenuAdmin"));
const MenuFinance = lazy(() => import("./pages/MenuFinance"));
const MenuGA = lazy(() => import("./pages/MenuGA"));

// GA Asset Management
const DaftarAset           = lazy(() => import("./pages/ga/DaftarAset"));
const FormAset             = lazy(() => import("./pages/ga/FormAset"));
const ScanQR               = lazy(() => import("./pages/ga/ScanQR"));
const DetailAset           = lazy(() => import("./pages/ga/DetailAset"));
const LaporanAset          = lazy(() => import("./pages/ga/LaporanAset"));
const LaporanAudit         = lazy(() => import("./pages/ga/LaporanAudit"));
const ApprovalPerpindahan  = lazy(() => import("./pages/ga/ApprovalPerpindahan"));
const Maintenance          = lazy(() => import("./pages/ga/Maintenance"));

function App(props) {
  const Router = props?.Router || BrowserRouter;
  return (
    <Router>
      <RouteMetadata />
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased selection:bg-[#0c2e59] selection:text-white">
        <ErrorBoundary>
          <Suspense fallback={<GlobalLoading />}>
            <Routes>
              <Route
                path="/dashboard-siswa-intensif"
                element={
                  <ProtectedRoute allowedRoles={["peserta_intensif"]}>
                    <DashboardSiswaIntensif />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account-settings"
                element={
                  <ProtectedRoute>
                    <AccountSettings />
                  </ProtectedRoute>
                }
              />
              {/* LMS Routes */}
              <Route path="/"                element={<Navigate to="/login" />} />
              <Route path="/login"           element={<Login />} />

              {/* Main Selector Route - Deprecated, redirect to login which handles role-based redirect */}
              <Route path="/home"            element={<Navigate to="/login" replace />} />

              {/* Protected Routes */}
              <Route path="/menu-karyawan"   element={<ProtectedRoute allowedRoles={["karyawan", "employee", "staff"]}><MenuKaryawan /></ProtectedRoute>} />
              <Route path="/menu-hrd"        element={<ProtectedRoute allowedRoles={["hr", "hrd", "hr_admin", "manager", "admin", "super_admin"]}><MenuHRD /></ProtectedRoute>} />
              <Route path="/menu-admin"      element={<ProtectedRoute allowedRoles={["admin", "super_admin"]}><MenuAdmin /></ProtectedRoute>} />
              <Route path="/menu-finance"    element={<ProtectedRoute allowedRoles={["finance", "admin", "super_admin"]}><MenuFinance /></ProtectedRoute>} />
              <Route path="/menu-ga"         element={<ProtectedRoute allowedRoles={["ga", "admin", "super_admin"]}><MenuGA /></ProtectedRoute>} />

              {/* GA Asset Management Routes */}
              <Route path="/assets"              element={<ProtectedRoute><DaftarAset /></ProtectedRoute>} />
              <Route path="/assets/tambah"       element={<ProtectedRoute><FormAset /></ProtectedRoute>} />
              <Route path="/assets/edit/:id"     element={<ProtectedRoute><FormAset /></ProtectedRoute>} />
              <Route path="/assets/scan"         element={<ProtectedRoute><ScanQR /></ProtectedRoute>} />
              <Route path="/assets/detail/:id"   element={<ProtectedRoute><DetailAset /></ProtectedRoute>} />
              <Route path="/assets/laporan"      element={<ProtectedRoute><LaporanAset /></ProtectedRoute>} />
              <Route path="/assets/audit"        element={<ProtectedRoute><LaporanAudit /></ProtectedRoute>} />
              <Route path="/assets/approval"     element={<ProtectedRoute><ApprovalPerpindahan /></ProtectedRoute>} />
              <Route path="/assets/maintenance"  element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />

              <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/employees"       element={<ProtectedRoute allowedRoles={["hr", "hrd", "hr_admin", "manager", "admin", "super_admin"]}><Employees /></ProtectedRoute>} />
                            <Route path="/access-rights"   element={<ProtectedRoute allowedRoles={["admin", "super_admin", "hr", "hrd", "manager"]}><AccessRights defaultRole="" /></ProtectedRoute>} />
              <Route path="/access-rights-ga" element={<ProtectedRoute allowedRoles={["admin", "super_admin", "hr", "hrd", "manager"]}><AccessRights defaultRole="ga" /></ProtectedRoute>} />
              <Route path="/access-rights-hr" element={<ProtectedRoute allowedRoles={["admin", "super_admin", "hr", "hrd", "manager"]}><AccessRights defaultRole="hr" /></ProtectedRoute>} />
              <Route path="/access-rights-finance" element={<ProtectedRoute allowedRoles={["admin", "super_admin", "hr", "hrd", "manager"]}><AccessRights defaultRole="finance" /></ProtectedRoute>} />
              <Route path="/assign-rfid"     element={<ProtectedRoute><AssignRFID /></ProtectedRoute>} />
              <Route path="/attendance"      element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
              <Route path="/strava"          element={<ProtectedRoute><StravaIntegration /></ProtectedRoute>} />
              <Route path="/strava-admin"    element={<ProtectedRoute><StravaAdmin /></ProtectedRoute>} />
              <Route path="/payroll"         element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
              <Route path="/payroll-hrd"     element={<ProtectedRoute><PayrollHRD /></ProtectedRoute>} />
              <Route path="/overtime"        element={<ProtectedRoute><Overtime /></ProtectedRoute>} />
              <Route path="/leaves"          element={<ProtectedRoute><Leaves /></ProtectedRoute>} />
              <Route path="/daily-report-admin" element={<ProtectedRoute><DailyReportAdmin /></ProtectedRoute>} />
              <Route path="/slip-gaji-karyawan" element={<ProtectedRoute><SlipGajiKaryawan /></ProtectedRoute>} />
              <Route path="/daily-report-karyawan" element={<ProtectedRoute><DailyReportKaryawan /></ProtectedRoute>} />
              <Route path="/reimbursement"   element={<ProtectedRoute><Reimbursement /></ProtectedRoute>} />
              <Route path="/profit"          element={<ProtectedRoute><Profit /></ProtectedRoute>} />
              <Route path="/buku-transaksi" element={<ProtectedRoute><BukuTransaksiPage /></ProtectedRoute>} />
              <Route path="/laporan-keuangan" element={<ProtectedRoute><FinanceWorkspace initialTab="reports" title="Laporan Keuangan" /></ProtectedRoute>} />
              {/* Finance Module Routes */}
              <Route path="/dashboard-finance"       element={<ProtectedRoute><DashboardFinance /></ProtectedRoute>} />
              <Route path="/transaksi-pemasukan"     element={<ProtectedRoute><TransaksiPemasukan /></ProtectedRoute>} />
              <Route path="/transaksi-pengeluaran"   element={<ProtectedRoute><TransaksiPengeluaran /></ProtectedRoute>} />
              <Route path="/history-invoice"         element={<ProtectedRoute><HistoryInvoice /></ProtectedRoute>} />
              <Route path="/invoice-penagihan"        element={<ProtectedRoute><InvoicePenagihan /></ProtectedRoute>} />
              <Route path="/bills"                   element={<ProtectedRoute><BillsPage /></ProtectedRoute>} />
              <Route path="/vendors"                 element={<ProtectedRoute><VendorsPage /></ProtectedRoute>} />
              <Route path="/coa"                     element={<ProtectedRoute><CoaPage /></ProtectedRoute>} />
              <Route path="/journal"                 element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
              <Route path="/general-ledger"          element={<ProtectedRoute><GeneralLedgerPage /></ProtectedRoute>} />
              <Route path="/reconciliation"          element={<ProtectedRoute><ReconciliationPage /></ProtectedRoute>} />
              <Route path="/rekening"                element={<ProtectedRoute><RekeningPage /></ProtectedRoute>} />
              <Route path="/cashflow"                element={<ProtectedRoute><CashflowPage /></ProtectedRoute>} />
              <Route path="/transfer"                element={<ProtectedRoute><TransferPage /></ProtectedRoute>} />
              <Route path="/anggaran"                element={<ProtectedRoute><AnggaranBiaya /></ProtectedRoute>} />
              <Route path="/salary"                  element={<ProtectedRoute><SalaryKaryawan /></ProtectedRoute>} />
              <Route path="/settings"        element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/positions"       element={<ProtectedRoute><Positions /></ProtectedRoute>} />
              <Route path="/face-enrollment" element={<ProtectedRoute><FaceEnrollment /></ProtectedRoute>} />
              <Route path="/face-clock"      element={<ProtectedRoute><FaceClock /></ProtectedRoute>} />
              <Route path="/location-settings" element={<ProtectedRoute><LocationSettings /></ProtectedRoute>} />

              {/* LPK Creativa Routes */}
              <Route path="/matching-job"    element={<ProtectedRoute><MatchingJob /></ProtectedRoute>} />
              <Route path="/nenkin"          element={<Navigate to="/lpk-nenkin" replace />} />
              <Route path="/lpk-nenkin"      element={<ProtectedRoute><LpkNenkin /></ProtectedRoute>} />
              <Route path="/lpk-alumni"      element={<ProtectedRoute><LpkAlumni /></ProtectedRoute>} />
              <Route path="/lpk-intensif"    element={<ProtectedRoute><LpkIntensif /></ProtectedRoute>} />
              <Route path="/lpk-magang"      element={<ProtectedRoute><LpkMagang /></ProtectedRoute>} />
              <Route path="/dashboard-creativa" element={<ProtectedRoute><DashboardCreativa /></ProtectedRoute>} />
              <Route path="/dashboard-peserta-nenkin" element={<ProtectedRoute><DashboardPesertaNenkin /></ProtectedRoute>} />
              <Route path="/dashboard-peserta-intensif" element={<ProtectedRoute><DashboardPesertaIntensif /></ProtectedRoute>} />
              <Route path="/dashboard-peserta-matching" element={<ProtectedRoute><DashboardPesertaMatching /></ProtectedRoute>} />
              <Route path="/dashboard-peserta-mendang" element={<ProtectedRoute><DashboardPesertaMendang /></ProtectedRoute>} />
              <Route path="/dashboard-peserta-alumni" element={<ProtectedRoute><DashboardPesertaAlumni /></ProtectedRoute>} />
              <Route path="/access-rights-sensei" element={<ProtectedRoute allowedRoles={["admin", "super_admin", "lpk"]}><AccessRightsLPK key="sensei" role="SENSEI" /></ProtectedRoute>} />
              <Route path="/access-rights-siswa" element={<ProtectedRoute allowedRoles={["admin", "super_admin", "lpk"]}><AccessRightsLPK key="siswa" role="PESERTA_INTENSIF" /></ProtectedRoute>} />
              <Route path="/lpk-absensi-sensei" element={<ProtectedRoute><LpkAttendance role="SENSEI" /></ProtectedRoute>} />
              <Route path="/lpk-absensi-siswa" element={<ProtectedRoute><LpkAttendance role="SISWA" /></ProtectedRoute>} />
              <Route path="/lpk-nilai" element={<ProtectedRoute><LpkNilai /></ProtectedRoute>} />
              <Route path="/lpk-tugas" element={<ProtectedRoute><LpkTugas /></ProtectedRoute>} />
              <Route path="/lpk-quiz" element={<ProtectedRoute><LpkQuiz /></ProtectedRoute>} />
              <Route path="/lpk-materi" element={<ProtectedRoute><LpkMateri /></ProtectedRoute>} />
              <Route path="/dashboard-sensei" element={<ProtectedRoute><DashboardSensei /></ProtectedRoute>} />
              {/* Sensei Sub-Routes */}
              <Route path="/sensei/barcode" element={<ProtectedRoute><SenseiBarcode /></ProtectedRoute>} />
              <Route path="/sensei/agenda" element={<ProtectedRoute><SenseiAgenda /></ProtectedRoute>} />
              <Route path="/sensei/materi" element={<ProtectedRoute><SenseiMateri /></ProtectedRoute>} />
              <Route path="/sensei/tugas" element={<ProtectedRoute><SenseiTugas /></ProtectedRoute>} />
              <Route path="/sensei/quiz" element={<ProtectedRoute><SenseiQuiz /></ProtectedRoute>} />
              <Route path="/sensei/ukom" element={<ProtectedRoute><SenseiUkom /></ProtectedRoute>} />
              <Route path="/sensei/konsultasi" element={<ProtectedRoute><SenseiKonsultasi /></ProtectedRoute>} />
              <Route path="/sensei/nilai-siswa" element={<ProtectedRoute><SenseiNilaiSiswa /></ProtectedRoute>} />
              <Route path="/sensei/kehadiran" element={<ProtectedRoute><SenseiKehadiran /></ProtectedRoute>} />
              <Route path="/sensei/leaderboard" element={<ProtectedRoute><SenseiLeaderboard /></ProtectedRoute>} />
              {/* LMS Routes */}
              <Route path="/lms/siswa" element={<ProtectedRoute><LpkIntensif /></ProtectedRoute>} />
              <Route path="/lms/kelas-saya" element={<ProtectedRoute><LmsKelasSaya /></ProtectedRoute>} />
              <Route path="/lms/classes" element={<ProtectedRoute allowedRoles={["admin","super_admin"]}><LearningClasses /></ProtectedRoute>} />
              <Route path="/finance/student-billing" element={<ProtectedRoute allowedRoles={["finance","finance_admin","admin","super_admin"]}><StudentBillingAdmin /></ProtectedRoute>} />
              <Route path="/lms/dashboard" element={<ProtectedRoute allowedRoles={["peserta_intensif"]}><LmsDashboard /></ProtectedRoute>} />
              <Route path="/lms/profil" element={<ProtectedRoute allowedRoles={["peserta_intensif"]}><LmsProfil /></ProtectedRoute>} />
              <Route path="/lms/kartu-siswa" element={<ProtectedRoute allowedRoles={["peserta_intensif"]}><LmsKartuSiswa /></ProtectedRoute>} />
              <Route path="/lms/tagihan" element={<ProtectedRoute allowedRoles={["peserta_intensif"]}><LmsTagihan /></ProtectedRoute>} />
              <Route path="/lms/ukom" element={<ProtectedRoute><LmsUkom /></ProtectedRoute>} />
              <Route path="/lms/konsultasi" element={<ProtectedRoute><LmsKonsultasi /></ProtectedRoute>} />
              <Route path="/lms/diskusi" element={<ProtectedRoute><LmsDiskusi /></ProtectedRoute>} />
              <Route path="/lms/kotoba" element={<ProtectedRoute><LmsKotoba /></ProtectedRoute>} />
              <Route path="/lms/kalender" element={<ProtectedRoute><LmsKalender /></ProtectedRoute>} />
              <Route path="/lms/agenda" element={<ProtectedRoute allowedRoles={["admin", "super_admin"]}><LmsAdminAgenda /></ProtectedRoute>} />
              <Route path="/lms/materi" element={<ProtectedRoute><LmsMateri /></ProtectedRoute>} />
              <Route path="/lms/tugas-quiz" element={<ProtectedRoute><LmsTugasQuiz /></ProtectedRoute>} />
              <Route path="/lms/tugas" element={<ProtectedRoute><LmsTugas /></ProtectedRoute>} />
              <Route path="/lms/quiz" element={<ProtectedRoute><LmsQuiz /></ProtectedRoute>} />
              <Route path="/lms/nilai" element={<ProtectedRoute><LmsNilai /></ProtectedRoute>} />
              <Route path="/lms/nilai-siswa" element={<ProtectedRoute><LmsNilai /></ProtectedRoute>} />
              <Route path="/lms/belajar-mandiri" element={<ProtectedRoute><LmsBelajar /></ProtectedRoute>} />
              <Route path="/lms/absensi" element={<ProtectedRoute><LmsAbsensi /></ProtectedRoute>} />
              <Route path="/lms/leaderboard" element={<ProtectedRoute><LmsLeaderboard /></ProtectedRoute>} />
              <Route path="/lms/latihan-kaiwa" element={<ProtectedRoute><LmsLatihanKaiwa /></ProtectedRoute>} />
              <Route path="/lms/kaiwa" element={<ProtectedRoute><LmsLatihanKaiwa /></ProtectedRoute>} />
              <Route path="/lms/instructor" element={<ProtectedRoute allowedRoles={["admin", "super_admin"]}><LmsInstructor /></ProtectedRoute>} />
              <Route path="/lms/presence-code" element={<ProtectedRoute><PresenceCode /></ProtectedRoute>} />
              <Route path="/lms/pengumuman" element={<ProtectedRoute><LmsPengumuman /></ProtectedRoute>} />
              <Route path="/lms/kalender-n5" element={<ProtectedRoute allowedRoles={["admin", "super_admin", "peserta_intensif"]}><LmsCalendar level="N5" /></ProtectedRoute>} />
              <Route path="/lms/kalender-n4" element={<ProtectedRoute allowedRoles={["admin", "super_admin", "peserta_intensif"]}><LmsCalendar level="N4" /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;
