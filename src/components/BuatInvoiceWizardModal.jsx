import { useState, useEffect, useCallback, useRef } from "react";
import {
  User,
  BookOpen,
  CreditCard,
  Landmark,
  FileText,
  Search,
  Plus,
  X,
  Printer,
  Download,
  Zap,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Info,
  Check,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Building,
  ChevronDown,
  Hash,
  Eye,
  FileDown,
  Send,
  Sparkles,
  Calculator,
  RefreshCw
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { loadInvoiceLookups, invoiceDecimal, formatInvoiceMoney, studentScheme, chargeSchedule, buildStudentInvoice, submitStudentInvoice, invoiceError } from "../utils/studentInvoice";
import {
  generateInvoicePDF,
  formatInvoiceDateShort,
  formatInvoiceDateUpper,
  createDirectorStampDataURL,
} from "../pages/InvoicePenagihan";

// ─── SYNCHRONOUS INITIAL LOADER DARI STUDENTS MODULE ──────────────────────────
const DEFAULT_INCLUSIONS_LIST = [
  "Kelas Bahasa Jepang Level N5 & N4",
  "Kelas Persiapan Ujian JFT & SSW",
  "Biaya Ujian JFT A2.2 & SSW (masing-masing tercover 1x)",
  "Buku & Materi Pelajaran",
  "Panel & Moodle (Learning Online System for Student)",
  "Seragam, ID Card & Suripa",
  "Sertifikat Kompetensi LPK",
  "Fasilitas Kelas & Asrama selama 7 bulan",
  "Praktek & Kegiatan LPK (FMD, Kunjungan Matsuri, Bukber, Acara Kelulusan, dll) *kondisional",
  "Konsultasi Pendidikan/Pelatihan & Peluang Karir di Jepang (kapan pun selama Pelatihan)",
];

const DEFAULT_EXCLUSIONS_LIST = [
  "Biaya Utilitas (Air, Listrik, Internet, & IPL Asrama per Bulan)",
  "Biaya Makan",
  "Keperluan Pribadi Lainnya"
];

const DEFAULT_TERMS_LIST = [
  "Invoice bersifat confidential (rahasia)"
];

const formatRp = formatInvoiceMoney;

export default function BuatInvoiceWizardModal({ onClose, onSuccess }) {
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const needsReconciliation = useRef(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const invoiceNumber = 'Diberikan server saat terbit';
  const [salesCode, setSalesCode] = useState('');
  const [tanggalInvoice, setTanggalInvoice] = useState(() => new Date().toISOString().slice(0, 10));
  const [lookups, setLookups] = useState({ students: [], banks: [], canPrepare: false });
  const [lookupLoading, setLookupLoading] = useState(true);
  const [lookupError, setLookupError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');
  const [selectedChargeId, setSelectedChargeId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isManualStudent, setIsManualStudent] = useState(false);
  const [manualStudent, setManualStudent] = useState({ nama: '', nis: '', phone: '', email: '', alamat: '', program: '', metodePembayaran: '', batch: '' });
  const [isSyncingPeserta, setIsSyncingPeserta] = useState(false);
  const [catatanOpsional, setCatatanOpsional] = useState('');

  const refreshLookups = useCallback(async (signal, sync = false) => {
    const next = await loadInvoiceLookups(axios, { signal, sync });
    if (signal?.aborted) return;
    setLookups(next);
    setSelectedStudentId(previous => next.students.some(row => row.databaseId === previous) ? previous : '');
    setSelectedAccountId(previous => next.banks.some(row => row.databaseId === previous) ? previous : '');
    setLookupError('');
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    refreshLookups(controller.signal).catch(error => { if (!controller.signal.aborted) setLookupError(invoiceError(error)); })
      .finally(() => { if (!controller.signal.aborted) setLookupLoading(false); });
    return () => controller.abort();
  }, [refreshLookups]);

  const liveStudents = lookups.students;
  const selectedStudent = liveStudents.find(row => row.databaseId === selectedStudentId);
  const availableEnrollments = (lookups.enrollments || []).filter(row => String(row.student_id) === selectedStudentId);
  const selectedEnrollment = availableEnrollments.find(row => String(row.id) === selectedEnrollmentId);
  const availableCharges = (lookups.charges || []).filter(row => String(row.enrollment_id) === selectedEnrollmentId);
  const selectedCharge = availableCharges.find(row => String(row.id) === selectedChargeId);
  const activeStudent = isManualStudent ? manualStudent : { ...selectedStudent, program: selectedEnrollment?.program || '', batch: selectedEnrollment?.cohort || '', metodePembayaran: selectedEnrollment?.payment_scheme === 'full' ? 'Full Payment' : selectedEnrollment?.payment_scheme === 'cicilan' ? 'Cicilan' : '' };
  const programInfo = { program: isManualStudent ? '' : (selectedEnrollment?.program || ''), lokasi: isManualStudent ? '' : (selectedStudent?.kota || ''), durasi: '' };
  let officialTotal = null, pembayaranList = [];
  try { if (!isManualStudent && selectedCharge) { officialTotal = invoiceDecimal(selectedCharge.amount); pembayaranList = chargeSchedule(selectedCharge, tanggalInvoice); } } catch { /* Explain missing approved policy below. */ }
  const skemaPembayaran = isManualStudent ? '' : studentScheme(selectedCharge?.scheme);
  const jatuhTempo = pembayaranList[0]?.jatuhTempo || '';
  const totalTagihan = officialTotal, subtotal = officialTotal, totalDiskon = '0.00';
  const items = officialTotal ? [{ id: 1, deskripsi: selectedCharge.label, subdeskripsi: programInfo.program, harga: officialTotal, diskon: '0.00', jumlah: officialTotal }] : [];
  const bankAccounts = lookups.banks;
  const selectedAccount = bankAccounts.find(row => row.databaseId === selectedAccountId)
    || { bank: '', nama: 'Belum ada rekening dipilih', noRek: '', pemilik: '', kode: '', saldo: null };

  const selectStudent = student => { if (submitting.current || needsReconciliation.current) return; setSelectedStudentId(student?.databaseId || ''); setSelectedEnrollmentId(''); setSelectedChargeId(''); setSubmitError(''); };
  const handleSyncPesertaFromWeb = async () => {
    setIsSyncingPeserta(true);
    try {
      await refreshLookups(undefined, true);
      await Swal.fire({ icon: 'success', title: 'Daftar Siswa Diperbarui', text: 'Pilih siswa berdasarkan ID database dari daftar terbaru.' });
    } catch (error) { setLookupError(invoiceError(error)); }
    finally { setIsSyncingPeserta(false); }
  };
  let payload, validationMessage = '';
  try {
    if (!lookups.canPrepare) throw new Error('Anda tidak memiliki permission untuk menerbitkan invoice.');
    payload = buildStudentInvoice({ ...lookups, students: liveStudents, banks: bankAccounts, enrollmentId: selectedEnrollmentId, chargeId: selectedChargeId, studentId: selectedStudentId, bankId: selectedAccountId,
      manual: isManualStudent, date: tanggalInvoice, notes: catatanOpsional, salesCode });
  } catch (error) { validationMessage = error.message; }
  const handleTerbitkanInvoice = async () => {
    if (submitting.current || !payload || lookupLoading || lookupError) return;
    submitting.current = true; setBusy(true); setSubmitError('');
    try {
      const issued = await submitStudentInvoice(axios, payload, needsReconciliation.current);
      needsReconciliation.current = false;
      await Swal.fire({ icon: 'success', title: 'Invoice Tersimpan di Server', text: `Invoice ${issued.id} ${issued.created_now ? "berhasil dibuat" : "sudah tersedia di server"}. Status: ${issued.status}. Pengiriman dan pembayaran mengikuti record server.` });
      onSuccess?.(); onClose();
    } catch (error) {
      needsReconciliation.current = Boolean(error.needsReconciliation);
      setSubmitError(error.message);
    } finally { submitting.current = false; setBusy(false); }
  };
  const handleSaveDraft = () => Swal.fire({ icon: 'info', title: 'Penyimpanan Draft Belum Tersedia', text: 'Belum ada penyimpanan draft backend. Isian hanya bertahan selama form terbuka dan belum menjadi invoice resmi. Jangan tutup form jika masih diperlukan.' });
  const handleDownloadPDF = () => {
    if (!payload) { setSubmitError(validationMessage); return; }
    generateInvoicePDF({ ...payload, id: 'PRATINJAU', status: 'Draft', customer: activeStudent.nama, email: activeStudent.email, phone: activeStudent.phone,
      program: programInfo.program, lokasi: programInfo.lokasi, items, installments: payload.installments,
      includes: DEFAULT_INCLUSIONS_LIST, excludes: DEFAULT_EXCLUSIONS_LIST,
      bank_name: selectedAccount.bank, account_number: selectedAccount.noRek, account_holder: selectedAccount.pemilik,
      notes: `PRATINJAU - belum diterbitkan di server. ${catatanOpsional}` });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex justify-center p-2 sm:p-4 lg:p-6 transition">
      <div className="bg-[#f8fafc] w-full max-w-[1440px] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[96vh]">

        {/* ── TOP HEADER (EXACT MOCKUP MATCH) ─────────────────────────────────── */}
        <div className="bg-white border-b border-slate-200 px-6 sm:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1">
              <span>Keuangan</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Sales / Pemasukan</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Invoice</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-600 font-bold">Buat Invoice</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Buat Invoice</h1>
              <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600 ml-auto p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium">Buat tagihan siswa untuk program pelatihan</p>
          </div>

          {/* Top Right Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-2 shadow-2xs"
            >
              <FileDown className="w-4 h-4 text-slate-500" />
              Simpan Draft
            </button>
            <button
              onClick={() => setShowPreviewModal(true)} disabled={!payload || busy}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-2 shadow-2xs"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              Preview Invoice
            </button>
            <button
              onClick={handleTerbitkanInvoice}
              disabled={busy || !payload || lookupLoading || Boolean(lookupError)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-blue-500/25 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Terbitkan Invoice
            </button>
            <button
              onClick={onClose}
              title="Tutup Form"
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition hidden md:flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── MAIN 2-COLUMN CONTENT SCROLLABLE BODY ───────────────────────────── */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
          <fieldset disabled={busy || isSyncingPeserta} className="space-y-6">
          <button type="button" onClick={() => refreshLookups().catch(error => setLookupError(invoiceError(error)))} className="text-xs font-bold text-blue-600">Muat ulang data resmi</button>
          {lookupLoading && <p role="status">Memuat siswa dan rekening resmi...</p>}
          {lookupError && <div role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{lookupError}<button type="button" onClick={() => refreshLookups().catch(error => setLookupError(invoiceError(error)))} className="ml-3 underline">Muat ulang lookup</button></div>}
          {!lookupLoading && bankAccounts.length === 0 && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Tidak ada rekening resmi yang aktif dan lengkap. Finance/DB PIC perlu melengkapi bank, nomor rekening, pemilik terverifikasi (account_holder), dan COA kas/bank aktif.</p>}
          {!lookupLoading && validationMessage && <p role="status" className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">{validationMessage}</p>}
          {submitError && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{submitError}</p>}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* ══════════════════════════════════════════════════════════════════
                LEFT COLUMN (8 COLS ~ 67%): MAIN FORM CARDS
            ══════════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-8 space-y-5">

              {/* CARD 1: INFORMASI INVOICE */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span>Informasi Invoice</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  {/* No Invoice */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">No. Invoice</label>
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      <input
                        type="text"
                        value={invoiceNumber}
                        readOnly
                        className="w-full bg-transparent font-bold text-slate-800 font-mono outline-none text-xs"
                      />
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md shrink-0 ml-1">
                        Otomatis
                      </span>
                    </div>
                  </div>

                  {/* Sales Code */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sales Code (Opsional)</label>
                    <input
                      type="text"
                      value={salesCode}
                      onChange={e => setSalesCode(e.target.value)}
                      placeholder="LPK-2026-08"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Tanggal Invoice */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tanggal Invoice</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={tanggalInvoice}
                        readOnly={busy || needsReconciliation.current} onChange={e => setTanggalInvoice(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Jatuh Tempo */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Jatuh Tempo</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={jatuhTempo}
                        readOnly
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: DATA SISWA */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <span>Data Siswa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSyncPesertaFromWeb}
                      disabled={isSyncingPeserta || busy || needsReconciliation.current}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                      title="Tarik data pendaftar terbaru dari creativabridging.com"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPeserta ? "animate-spin" : ""}`} />
                      {isSyncingPeserta ? "Menarik Data..." : "Tarik Siswa dari Web Pendaftaran"}
                    </button>
                    <button
                      type="button"
                      disabled={busy || needsReconciliation.current} onClick={() => setIsManualStudent(!isManualStudent)}
                      className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {isManualStudent ? "Pilih dari Daftar Siswa" : "+ Tambah Siswa Baru"}
                    </button>
                  </div>
                </div>

                {/* Pilih Siswa Selector */}
                {!isManualStudent ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Pilih Siswa <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          aria-label="Siswa database"
                          value={selectedStudentId}
                          onChange={e => selectStudent(liveStudents.find(row => row.databaseId === e.target.value))}
                          disabled={liveStudents.length === 0 || busy || needsReconciliation.current}
                          className="w-full bg-white border border-slate-300 hover:border-blue-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer appearance-none pr-10 transition disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          {liveStudents.length === 0 ? (
                            <option value="">Belum ada siswa terdaftar di Modul Students</option>
                          ) : (
                            [<option key="empty" value="">Pilih siswa database</option>, ...liveStudents.map(s => (
                              <option key={s.databaseId} value={s.databaseId}>
                                {s.nama} (DB {s.databaseId}{s.nis ? ` / NIS ${s.nis}` : ""})
                              </option>
                            ))]
                          )}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <Search className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    {/* Selected Student Information (Bootstrap / Laravel Classic Table Style) */}
                    {selectedStudent && (
                      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs bg-white mt-1">
                        <table className="w-full text-xs text-left border-collapse">
                          <tbody>
                            <tr className="border-b border-slate-200">
                              <th className="bg-slate-50 text-slate-600 font-semibold px-3 py-2 w-28 border-r border-slate-200">Nama Siswa</th>
                              <td className="px-3 py-2 font-bold text-slate-900 border-r border-slate-200">{activeStudent.nama}</td>
                              <th className="bg-slate-50 text-slate-600 font-semibold px-3 py-2 w-28 border-r border-slate-200">NIS</th>
                              <td className="px-3 py-2 font-mono font-semibold text-blue-700">{activeStudent.nis}</td>
                            </tr>
                            <tr className="border-b border-slate-200">
                              <th className="bg-slate-50 text-slate-600 font-semibold px-3 py-2 border-r border-slate-200">No. WhatsApp</th>
                              <td className="px-3 py-2 text-slate-800 border-r border-slate-200">{activeStudent.phone}</td>
                              <th className="bg-slate-50 text-slate-600 font-semibold px-3 py-2 border-r border-slate-200">Program</th>
                              <td className="px-3 py-2 text-slate-800">{activeStudent.program}</td>
                            </tr>
                            <tr className="border-b border-slate-200">
                              <th className="bg-slate-50 text-slate-600 font-semibold px-3 py-2 border-r border-slate-200">Email</th>
                              <td className="px-3 py-2 text-slate-800 border-r border-slate-200">{activeStudent.email}</td>
                              <th className="bg-slate-50 text-slate-600 font-semibold px-3 py-2 border-r border-slate-200">Batch</th>
                              <td className="px-3 py-2 text-slate-800">{activeStudent.batch}</td>
                            </tr>
                            <tr className="border-b border-slate-200">
                              <th className="bg-slate-50 text-slate-600 font-semibold px-3 py-2 border-r border-slate-200">Alamat</th>
                              <td className="px-3 py-2 text-slate-800 border-r border-slate-200 truncate max-w-xs">{activeStudent.alamat}</td>
                              <th className="bg-slate-50 text-slate-600 font-semibold px-3 py-2 border-r border-slate-200">Status</th>
                              <td className="px-3 py-2">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {activeStudent.status || "Siswa Aktif"}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <th className="bg-slate-50 text-slate-600 font-semibold px-3 py-2 border-r border-slate-200">Pembayaran</th>
                              <td colSpan={3} className="px-3 py-2">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${(activeStudent.metodePembayaran || "").toLowerCase().includes("cicil")
                                      ? "bg-amber-50 text-amber-800 border-amber-200"
                                      : "bg-blue-50 text-blue-800 border-blue-200"
                                    }`}
                                >
                                  {activeStudent.metodePembayaran || "Belum tersedia di database"}
                                </span>
                                {activeStudent.fromWeb && (
                                  <span className="ml-2 text-[10px] font-semibold text-emerald-700">
                                    • Otomatis disinkronkan dari Web Pendaftaran
                                  </span>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Form Input Siswa Baru Manual */
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Nama Lengkap Siswa *</label>
                      <input
                        type="text"
                        placeholder="Nama Siswa"
                        value={manualStudent.nama}
                        onChange={e => setManualStudent({ ...manualStudent, nama: e.target.value })}
                        className="w-full p-2 bg-white rounded-lg border border-slate-200 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">NIS / ID Siswa</label>
                      <input
                        type="text"
                        value={manualStudent.nis}
                        onChange={e => setManualStudent({ ...manualStudent, nis: e.target.value })}
                        className="w-full p-2 bg-white rounded-lg border border-slate-200 font-bold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">WhatsApp / No HP</label>
                      <input
                        type="text"
                        placeholder="0812-xxxx-xxxx"
                        value={manualStudent.phone}
                        onChange={e => setManualStudent({ ...manualStudent, phone: e.target.value })}
                        className="w-full p-2 bg-white rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={manualStudent.email}
                        onChange={e => setManualStudent({ ...manualStudent, email: e.target.value })}
                        className="w-full p-2 bg-white rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Program Pilihan</label>
                      <input type="text" value={manualStudent.program} onChange={e => setManualStudent({ ...manualStudent, program: e.target.value })} className="w-full p-2 bg-white rounded-lg border border-slate-200" />
                    </div>
                    <div><p className="text-amber-800">Siswa harus terdaftar di database sebelum invoice dapat diterbitkan. Form ini tidak mendaftarkan siswa secara otomatis.</p></div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 font-semibold mb-1">Alamat</label>
                      <input
                        type="text"
                        placeholder="Alamat domisili"
                        value={manualStudent.alamat}
                        onChange={e => setManualStudent({ ...manualStudent, alamat: e.target.value })}
                        className="w-full p-2 bg-white rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 3: PROGRAM & ITEM TAGIHAN */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-900 font-bold text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span>Program & Item Tagihan</span>
                  </div>
                  {selectedStudent && !isManualStudent && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Data Resmi Finance
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="font-semibold text-slate-700">Enrollment resmi
                    <select aria-label="Enrollment database" value={selectedEnrollmentId} disabled={isManualStudent || busy || needsReconciliation.current} onChange={e => { setSelectedEnrollmentId(e.target.value); setSelectedChargeId(''); setSubmitError(''); }} className="mt-1 w-full bg-white border border-slate-300 rounded-xl px-3 py-2">
                      <option value="">Pilih enrollment siswa</option>
                      {availableEnrollments.map(row => <option key={row.id} value={row.id}>{row.program || row.program_id || 'Program perlu review'} ? {row.cohort || row.external_enrollment_id} ({row.enrollment_status}{row.review_reason ? ', perlu review' : ''})</option>)}
                    </select>
                  </label>
                  <label className="font-semibold text-slate-700">Charge approved
                    <select aria-label="Charge approved" value={selectedChargeId} disabled={isManualStudent || busy || needsReconciliation.current} onChange={e => { setSelectedChargeId(e.target.value); setSubmitError(''); }} className="mt-1 w-full bg-white border border-slate-300 rounded-xl px-3 py-2">
                      <option value="">Pilih charge terotorisasi</option>
                      {availableCharges.map(row => <option key={row.id} value={row.id}>{row.label} ? {row.charge_key}{row.billing_invoice_id ? ' (sudah terbit: ' + row.billing_invoice_id + ')' : ''}</option>)}
                    </select>
                  </label>
                </div>
                {!isManualStudent && (!selectedEnrollment || !availableCharges.length) && <p className="text-xs text-amber-800">Pilih enrollment yang tepat. Enrollment dan charge memerlukan identitas serta approval Finance; harga siswa lama tidak digunakan sebagai pengganti. Jika daftar kosong, hubungi Finance/DB PIC.</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div><label className="block text-slate-500 mb-1">Program Resmi Siswa</label><input readOnly value={programInfo.program || 'Belum tersedia'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold" /></div>
                  <div><label className="block text-slate-500 mb-1">Lokasi Database</label><input readOnly value={programInfo.lokasi || 'Belum tersedia'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" /></div>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs"><thead className="bg-slate-50"><tr><th className="p-3">Item Resmi</th><th className="p-3 text-right">Harga</th><th className="p-3 text-right">Diskon Tambahan</th><th className="p-3 text-right">Jumlah</th></tr></thead>
                    <tbody>{items.map(item => <tr key={item.id}><td className="p-3 font-bold">{item.deskripsi}</td><td className="p-3 text-right">{formatRp(item.harga)}</td><td className="p-3 text-right">{formatRp(item.diskon)}</td><td className="p-3 text-right font-bold">{formatRp(item.jumlah)}</td></tr>)}</tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-500">Biaya berasal dari snapshot charge approved untuk enrollment yang dipilih. Nominal dan diskon tidak dapat diubah melalui invoice.</p>
              </div>

              {/* ROW DENGAN 2 CARD KEMBAR: SKEMA PEMBAYARAN & REKENING TUJUAN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* CARD 4: SKEMA PEMBAYARAN */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span>Skema Pembayaran</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <p className="font-bold">{skemaPembayaran === 'cicilan' ? 'Cicilan' : skemaPembayaran === 'full' ? 'Full Payment' : 'Skema belum tersedia di database'}</p>
                    <p className="text-slate-500">Termin mengikuti snapshot approved. Termin dalam satu invoice tidak membuat invoice terpisah.</p>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl"><table className="w-full text-[11px]"><thead className="bg-slate-50"><tr><th className="p-2">Deskripsi</th><th className="p-2">Jatuh Tempo</th><th className="p-2">Nominal</th></tr></thead>
                      <tbody>{pembayaranList.map(p => <tr key={p.id}>
                        <td className="p-2"><input aria-label="Deskripsi termin" readOnly value={p.deskripsi} className="w-full bg-transparent" /></td>
                        <td className="p-2"><input aria-label="Jatuh tempo termin" type="date" readOnly value={p.jatuhTempo} className="w-full bg-transparent" /></td>
                        <td className="p-2"><input aria-label="Nominal termin" readOnly value={p.nominal} className="w-28 text-right bg-transparent font-mono" /></td>
                      </tr>)}</tbody></table></div>
                  </div>
                </div>

                {/* CARD 5: REKENING TUJUAN & CATATAN */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <span>Rekening Tujuan</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-semibold text-slate-500">
                          Rekening Tujuan (Tersinkron COA & Bank) *
                        </label>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          COA Aktif: {selectedAccount.kode}
                        </span>
                      </div>
                      <select
                        aria-label="Rekening resmi"
                        value={selectedAccountId}
                        disabled={bankAccounts.length === 0}
                        onChange={e => setSelectedAccountId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">Pilih rekening resmi</option>
                        {bankAccounts.map(acc => (
                          <option key={acc.databaseId} value={acc.databaseId}>
                            {acc.bank} — {acc.nama} ({acc.kode ? `COA ${acc.kode}` : acc.noRek})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bank Card Display (Linked dynamically to selected COA Account) */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Dynamic Bank Badge Logo */}
                        <div className={`w-12 h-7 rounded-md flex items-center justify-center shadow-2xs font-black text-xs italic tracking-wider text-white ${selectedAccount.bank.toLowerCase().includes("mandiri") ? "bg-amber-600" :
                            selectedAccount.bank.toLowerCase().includes("bni") ? "bg-teal-600" :
                              selectedAccount.bank.toLowerCase().includes("bri") ? "bg-blue-800" :
                                "bg-blue-700"
                          }`}>
                          {selectedAccount.bank.toUpperCase().slice(0, 4)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900 text-xs">{selectedAccount.nama}</p>
                            <span className="text-[9px] font-mono font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                              COA {selectedAccount.kode}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{selectedAccount.pemilik}</p>
                          <p className="font-mono text-xs font-extrabold text-slate-800 tracking-wide">{selectedAccount.noRek}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-semibold">Saldo Terkini (COA / Kas)</p>
                        <p className="font-mono font-black text-emerald-600 text-xs">{formatRp(selectedAccount.saldo)}</p>
                        <button
                          type="button"
                          onClick={() => Swal.fire({
                            title: selectedAccount.nama,
                            html: `<div class='text-left text-xs space-y-2 p-2'>
                              <p><b>Akun COA:</b> ${selectedAccount.kode} - ${selectedAccount.nama}</p>
                              <p><b>Bank:</b> ${selectedAccount.bank}</p>
                              <p><b>Nomor Rekening:</b> ${selectedAccount.noRek}</p>
                              <p><b>Atas Nama:</b> ${selectedAccount.pemilik}</p>
                              <p><b>Saldo Buku Besar:</b> ${formatRp(selectedAccount.saldo)}</p>
                              <p class="text-[11px] text-slate-400 mt-2">Data ini terhubung langsung dengan Chart of Accounts (COA) dan master rekening bank perusahaan.</p>
                            </div>`,
                            confirmButtonColor: '#2563eb',
                            confirmButtonText: 'Tutup',
                            customClass: { popup: 'rounded-2xl' }
                          })}
                          className="text-[10px] font-bold text-blue-600 hover:underline mt-0.5"
                        >
                          Lihat Detail Rekening
                        </button>
                      </div>
                    </div>

                    {/* Catatan (Opsional) */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-blue-600" /> Catatan (Opsional)
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={catatanOpsional}
                        onChange={e => setCatatanOpsional(e.target.value)}
                        placeholder="Tambahkan catatan untuk siswa..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <div className="text-right text-[10px] text-slate-400 mt-0.5">
                        {catatanOpsional.length}/500
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                RIGHT COLUMN (4 COLS ~ 33%): SIDEBAR CARDS
            ══════════════════════════════════════════════════════════════════ */}
            <div className="lg:col-span-4 space-y-4">

              {/* CARD 1: RINGKASAN INVOICE */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <span>Ringkasan Invoice</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-800 font-mono">{formatRp(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Total Diskon</span>
                    <span className="font-bold text-slate-800 font-mono">{formatRp(totalDiskon)}</span>
                  </div>
                </div>

                {/* Banner Total Tagihan (Solid Blue Strip Matching Mockup) */}
                <div className="bg-blue-600 text-white rounded-xl px-4 py-3 flex items-center justify-between shadow-md shadow-blue-500/20">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Tagihan</span>
                  <span className="text-base font-black font-mono">{formatRp(totalTagihan)}</span>
                </div>
              </div>

              {/* CARD 2: BIAYA SUDAH TERMASUK (INCLUDED) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Biaya Sudah Termasuk (Included)</span>
                </div>

                <ol className="space-y-2 text-[11px] text-slate-700 list-decimal list-inside leading-relaxed">
                  {DEFAULT_INCLUSIONS_LIST.map((inc, i) => (
                    <li key={i} className="pl-0.5">
                      <span className="text-slate-800 font-medium">{inc}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* CARD 3: BIAYA TIDAK TERMASUK (EXCLUDED) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Biaya Tidak Termasuk (Excluded)</span>
                </div>

                <ol className="space-y-1.5 text-[11px] text-slate-700 list-decimal list-inside leading-relaxed">
                  {DEFAULT_EXCLUSIONS_LIST.map((exc, i) => (
                    <li key={i} className="pl-0.5">
                      <span className="text-slate-800 font-medium">{exc}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* CARD 4: CATATAN / TERMS */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Catatan / Terms</span>
                </div>

                <ul className="space-y-2 text-[11px] text-slate-700 list-disc list-inside leading-relaxed">
                  {DEFAULT_TERMS_LIST.map((t, i) => (
                    <li key={i} className="pl-0.5">
                      <span className="text-slate-800 font-medium">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>

          {/* ── BOTTOM ACTION BAR (MATCHING MOCKUP) ────────────────────────────── */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 flex-wrap">
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-2 shadow-2xs"
            >
              <FileDown className="w-4 h-4 text-slate-500" />
              Simpan Draft
            </button>
            <button
              onClick={() => setShowPreviewModal(true)} disabled={!payload || busy}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-2 shadow-2xs"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              Preview Invoice
            </button>
            <button
              onClick={handleTerbitkanInvoice}
              disabled={busy || !payload || lookupLoading || Boolean(lookupError)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-blue-500/25 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Terbitkan Invoice
            </button>
          </div>

          </fieldset>
        </div>

        {/* ── MODAL PREVIEW INVOICE DOKUMEN (POPUP DIALOG) ───────────────────── */}
        {showPreviewModal && payload && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6" onClick={() => setShowPreviewModal(false)}>
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>

              {/* Header Preview */}
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Preview Dokumen Invoice Resmi</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{invoiceNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-slate-700 rounded-xl bg-slate-800 text-xs font-bold px-2 py-1">
                    <button onClick={() => setZoomLevel(Math.max(70, zoomLevel - 10))} className="px-1 text-slate-400 hover:text-white">-</button>
                    <span className="px-1 text-slate-200">{zoomLevel}%</span>
                    <button onClick={() => setZoomLevel(Math.min(130, zoomLevel + 10))} className="px-1 text-slate-400 hover:text-white">+</button>
                  </div>
                  <button
                    onClick={handleDownloadPDF}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh PDF
                  </button>
                  <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-white p-1 ml-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Document Sheet Preview */}
              <div className="p-6 overflow-y-auto bg-slate-100 flex justify-center">
                <div
                  className="bg-white text-slate-900 rounded-2xl p-9 shadow-md max-w-[780px] w-full border border-slate-200 font-sans text-[12px] leading-relaxed"
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
                >
                  {/* Kop Surat Resmi (Sesuai Gambar 1) */}
                  <div className="flex items-start justify-between pb-3 border-b-2 border-blue-900 relative after:content-[''] after:block after:w-full after:border-b after:border-blue-900 after:absolute after:-bottom-1 after:left-0">
                    <div className="flex items-center">
                      <img
                        src="/images/creativa-kop-logo.png"
                        alt="Creativa Bridging Internasional"
                        className="h-14 w-auto object-contain"
                      />
                    </div>

                    <div className="text-right font-serif">
                      <h2 className="text-[28px] font-bold text-black leading-none tracking-tight">INVOICE</h2>
                      <p className="text-[11px] font-bold text-black mt-1">PT. Creativa Bridging International</p>
                      <p className="text-[10px] text-slate-700 leading-tight mt-0.5">
                        Ruko Business Park, Jl. Ir. H. Juanda, Panembong, Ruko B1
                      </p>
                      <p className="text-[10px] text-slate-700 leading-tight">
                        Mekarsari, Kec. Cianjur, Kab. Cianjur, Jawa Barat 43211
                      </p>
                      <p className="text-[10px] text-slate-700 leading-tight">
                        +62 815-2222-672 | creativabridging.com
                      </p>
                    </div>
                  </div>

                  {/* To & Meta Block (Sesuai Gambar 2) */}
                  <div className="py-5 flex justify-between items-start gap-4">
                    <div>
                      <p className="text-slate-500 text-xs">To,</p>
                      <p className="text-xs font-bold text-amber-800">PRATINJAU - belum diterbitkan di server</p>
                      <p className="text-sm font-bold text-black uppercase mt-1">{activeStudent.nama || "-"}</p>
                      <div className="mt-3 text-slate-500 text-xs space-y-0.5">
                        {activeStudent.phone && activeStudent.phone !== "-" && <p>{activeStudent.phone}</p>}
                        {activeStudent.email && activeStudent.email !== "-" && <p>{activeStudent.email}</p>}
                      </div>
                    </div>

                    <div className="text-xs">
                      <table className="border-collapse ml-auto">
                        <tbody>
                          <tr>
                            <td className="font-bold text-black pr-2 py-0.5 text-right">Invoice Number</td>
                            <td className="text-slate-800 py-0.5">: {invoiceNumber}</td>
                          </tr>
                          <tr>
                            <td className="font-bold text-black pr-2 py-0.5 text-right">Invoice Date</td>
                            <td className="text-slate-800 py-0.5">: {formatInvoiceDateShort(tanggalInvoice)}</td>
                          </tr>
                          <tr>
                            <td className="font-bold text-black pr-2 py-0.5 text-right">Payment Due</td>
                            <td className="text-slate-800 py-0.5">: {formatInvoiceDateShort(jatuhTempo)}</td>
                          </tr>
                          <tr>
                            <td className="font-bold text-black pr-2 py-0.5 text-right">Amount Due</td>
                            <td className="text-slate-800 py-0.5">: {formatRp(totalTagihan)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Items Navy Bar & Content (Sesuai Gambar 2-4) */}
                  <div className="w-full bg-[#163660] text-white font-bold text-xs grid grid-cols-12 px-3 py-2">
                    <div className="col-span-7">Items</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-3 text-right">Amount</div>
                  </div>

                  <div className="py-3 space-y-3">
                    {items.map(it => (
                      <div key={it.id} className="grid grid-cols-12 px-2 items-start">
                        <div className="col-span-7 pr-4">
                          <p className="font-bold text-black text-[13px]">{it.deskripsi}</p>
                          {it.subdeskripsi && <p className="text-slate-700 text-xs mt-0.5">{it.subdeskripsi}</p>}
                        </div>
                        <div className="col-span-2 text-right font-bold text-black text-[13px]">
                          {formatRp(it.harga)}
                        </div>
                        <div className="col-span-3 text-right font-bold text-black text-[13px]">
                          {formatRp(it.jumlah)}
                        </div>
                      </div>
                    ))}

                    <div className="px-2 pt-2 space-y-3 text-xs text-slate-800">
                      <div>
                        <p className="font-bold text-black mb-1">Biaya Sudah Termasuk:</p>
                        <ol className="list-decimal pl-7 space-y-0.5">
                          {DEFAULT_INCLUSIONS_LIST.map((inc, idx) => (
                            <li key={idx}>{inc}</li>
                          ))}
                        </ol>
                      </div>

                      <div>
                        <p className="font-bold text-black mb-1">Biaya Tidak Termasuk:</p>
                        <ol className="list-decimal pl-7 space-y-0.5">
                          {DEFAULT_EXCLUSIONS_LIST.map((exc, idx) => (
                            <li key={idx}>{exc}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Totals Block (Sesuai Gambar 5) */}
                  <div className="border-t border-slate-700 mt-3 pt-2 flex justify-end">
                    <div className="w-72 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-500">
                        <span className="font-bold text-black">Subtotal:</span>
                        <span className="text-black">{formatRp(subtotal)}</span>
                      </div>
                      {totalDiskon > 0 && (
                        <div className="flex justify-between py-1.5 border-b border-slate-400">
                          <span className="font-bold text-black">Discount:</span>
                          <span className="text-black">- {formatRp(totalDiskon)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1.5 border-b border-slate-500">
                        <span className="font-bold text-black">Total:</span>
                        <span className="text-black">{formatRp(totalTagihan)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 font-bold text-black">
                        <span>Amount Due (IDR):</span>
                        <span>{formatRp(totalTagihan)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Installment Table (Sesuai Gambar 6) */}
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-black mb-2">Installment</h3>
                    <table className="w-full text-xs border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-white text-black font-bold">
                          <th className="border border-slate-300 px-3 py-2 text-left">Description</th>
                          <th className="border border-slate-300 px-3 py-2 text-left">Date</th>
                          <th className="border border-slate-300 px-3 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pembayaranList.map((inst, idx) => (
                          <tr key={inst.id || idx}>
                            <td className="border border-slate-300 px-3 py-2 uppercase">
                              {inst.deskripsi || (pembayaranList.length === 1 ? "FULL PAYMENT" : `CICILAN KE-${idx + 1}`)}
                            </td>
                            <td className="border border-slate-300 px-3 py-2">
                              {formatInvoiceDateUpper(inst.jatuhTempo)}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 text-right">
                              {formatRp(inst.nominal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Notes/Terms (Sesuai Gambar 6) */}
                  <div className="mt-6 space-y-1.5 text-xs text-slate-900">
                    <p className="font-bold text-sm text-black">Notes/Terms</p>
                    <p>
                      Biaya ujian SSW selain program SSW kaigo, pengolahan makanan, pertanian, perikanan, dan restoran dikenakan biaya tambahan Rp 500.000.
                    </p>
                    {catatanOpsional && <p>{catatanOpsional}</p>}
                    <p className="text-slate-500 text-[11px]">https://creativabridging.com/</p>
                  </div>

                  {/* Confidential, Cara Pembayaran & TTD Direktur (Sesuai Gambar 7 & 8) */}
                  <div className="mt-6 pt-4 border-t border-slate-300 space-y-4 text-xs text-slate-900">
                    <p>Invoice bersifat confidential (rahasia)</p>

                    <div>
                      <p className="mb-1.5">Cara Pembayaran :</p>
                      <ol className="list-decimal pl-6 space-y-1">
                        <li>
                          <p>Transfer via ATM/Bank</p>
                          <p>
                            Bank {selectedAccount.bank} No. Rekening {selectedAccount.noRek} atas nama {selectedAccount.pemilik}
                          </p>
                        </li>
                        <li>Cantumkan keterangan / berita Transfer dengan memasukkan Nomor Invoice diatas</li>
                        <li>
                          Kirim Bukti Transfer ke email{" "}
                          <span className="text-blue-700 underline">finance@creativabridging.com</span>
                        </li>
                      </ol>
                    </div>

                    <p className="pt-2">Terimakasih telah bergabung dengan LPK CREATIVA</p>

                    <div className="pt-2 space-y-0.5">
                      <p>LPK CREATIVA Team</p>
                      <p>https://creativabridging.com/</p>
                      <p>Telp/SMS/WA +81 80-7948-7205</p>
                    </div>

                    <div className="pt-3">
                      <p>Diketahui Oleh,</p>
                      {createDirectorStampDataURL() && (
                        <img
                          src={createDirectorStampDataURL()}
                          alt="Tanda Tangan dan Stempel Direktur"
                          className="h-20 w-auto my-1 object-contain"
                        />
                      )}
                      <p>Siti Nurhatifah</p>
                      <p>Direktur</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
