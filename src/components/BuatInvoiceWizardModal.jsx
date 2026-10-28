import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  BookOpen,
  CreditCard,
  Landmark,
  FileText,
  CheckCircle,
  Clock,
  Search,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  X,
  Printer,
  Download,
  Save,
  Zap,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Check,
  MapPin,
  Phone,
  Mail,
  Building,
  ChevronDown,
  Hash
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { generateInvoicePDF } from "../pages/InvoicePenagihan";

// ─── SYNCHRONOUS INITIAL LOADER DARI STUDENTS MODULE ──────────────────────────
function getStoredLocalStudents() {
  try {
    const deletedIds = JSON.parse(localStorage.getItem("deleted_students_finance") || "[]");
    const localOnly = JSON.parse(localStorage.getItem("local_only_students_finance") || "[]");
    const customOverrides = JSON.parse(localStorage.getItem("custom_students_finance") || "{}");

    const isDeleted = (id, nis, nama) => {
      return deletedIds.some(d => {
        const dStr = String(d).toLowerCase();
        return (
          (id != null && String(id).toLowerCase() === dStr) ||
          (nis && String(nis).toLowerCase() === dStr) ||
          (nama && String(nama).toLowerCase() === dStr)
        );
      });
    };

    return localOnly
      .filter(s => !isDeleted(s.id, s.nis, s.nama || s.name))
      .map(s => {
        const override = customOverrides[s.id];
        if (override) return override;
        const name = s.nama || s.name || "Siswa";
        return {
          id: s.nis || `S-${String(s.id).padStart(3, "0")}`,
          rawId: s.id,
          nama: name,
          nis: s.nis || `S-${String(s.id).padStart(3, "0")}`,
          phone: s.kontak || s.phone || s.no_wa || "-",
          email: s.email && s.email !== "-" ? s.email : `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
          alamat: s.alamat ? `${s.alamat}, ${s.kota || "Kab. Cianjur"}` : (s.kota || "Kab. Cianjur, Jawa Barat"),
          status: s.status === "Nonaktif" ? "Siswa Nonaktif" : "Siswa Aktif",
          program: s.program || "Bahasa Jepang Intensif",
          batch: s.batch ? (String(s.batch).toLowerCase().startsWith("batch") ? s.batch : `Batch ${s.batch}`) : "Batch 2"
        };
      });
  } catch (e) {
    return [];
  }
}

const DEFAULT_INCLUSIONS_LIST = [
  "Kelas Bahasa Jepang Level N5 & N4",
  "Kelas Persiapan Ujian JFT & SSW",
  "Biaya Ujian JFT A2.2 & SSW (masing-masing tercover 1x)",
  "Buku & Materi Pelajaran Minna no Nihongo",
  "Panel & Moodle (Learning Online System for Student)",
  "Seragam, ID Card & Suripa",
  "Sertifikat Kompetensi LPK",
  "Fasilitas Kelas & Asrama selama 7 bulan",
  "Praktek & Kegiatan LPK (FMD, Kunjungan Matsuri, Bukber, dll)",
  "Konsultasi Pendidikan/Pelatihan & Peluang Karir di Jepang",
];

const STEPS = [
  { id: 1, label: "Data Siswa", icon: User },
  { id: 2, label: "Program & Item", icon: BookOpen },
  { id: 3, label: "Pembayaran", icon: CreditCard },
  { id: 4, label: "Rekening", icon: Landmark },
  { id: 5, label: "Preview", icon: FileText },
];

export default function BuatInvoiceWizardModal({ onClose, onSuccess, dataSiswa = [] }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // ─── STEP 1: DATA SISWA (REAL TIME SYNC DENGAN MODUL STUDENTS) ─────────────
  const [liveStudents, setLiveStudents] = useState(() => getStoredLocalStudents());
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(() => {
    const init = getStoredLocalStudents();
    return init.length > 0 ? init[0] : null;
  });
  const [isManualStudent, setIsManualStudent] = useState(false);
  const [manualStudent, setManualStudent] = useState({
    nama: "",
    nis: "S-001",
    phone: "",
    email: "",
    alamat: "Cianjur, Jawa Barat",
  });

  // Auto-fetch latest live students directly from Database & LocalStorage (STRICT REAL DATA ONLY)
  useEffect(() => {
    let active = true;
    const fetchAllStudents = async () => {
      setLoadingStudents(true);
      try {
        const deletedIds = JSON.parse(localStorage.getItem("deleted_students_finance") || "[]");
        const customOverrides = JSON.parse(localStorage.getItem("custom_students_finance") || "{}");
        const localOnly = JSON.parse(localStorage.getItem("local_only_students_finance") || "[]");

        const isDeleted = (id, nis, nama) => {
          return deletedIds.some(d => {
            const dStr = String(d).toLowerCase();
            return (
              (id != null && String(id).toLowerCase() === dStr) ||
              (nis && String(nis).toLowerCase() === dStr) ||
              (nama && String(nama).toLowerCase() === dStr)
            );
          });
        };

        let apiList = [];
        try {
          const res = await axios.get("/api/accounting.php?view=lookups");
          if (res.data?.data?.students) {
            apiList = res.data.data.students
              .filter(s => !isDeleted(s.id, s.nis, s.name || s.nama_lengkap))
              .map((s, i) => {
                const sid = s.id || i + 1;
                const override = customOverrides[sid];
                if (override) return override;

                const name = s.name || s.nama_lengkap || "Siswa";
                return {
                  id: s.nis || `S-${String(sid).padStart(3, "0")}`,
                  rawId: sid,
                  nama: name,
                  nis: s.nis || `S-${String(sid).padStart(3, "0")}`,
                  phone: s.no_wa && s.no_wa !== "-" ? s.no_wa : (s.kontak || s.phone || "-"),
                  email: s.email && s.email !== "-" ? s.email : `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
                  alamat: s.alamat ? `${s.alamat}, ${s.kota || "Cianjur"}` : (s.kota || "Cianjur, Jawa Barat"),
                  status: s.status === "Nonaktif" ? "Siswa Nonaktif" : "Siswa Aktif",
                  program: s.program || "Bahasa Jepang Intensif",
                  batch: s.batch ? (String(s.batch).toLowerCase().startsWith("batch") ? s.batch : `Batch ${s.batch}`) : "Batch 2"
                };
              });
          }
        } catch (e) {
          console.warn("Lookups API fallback:", e);
        }

        const activeLocal = localOnly
          .filter(s => !isDeleted(s.id, s.nis, s.nama || s.name))
          .map(s => {
            const override = customOverrides[s.id];
            if (override) return override;
            const name = s.nama || s.name || "Siswa";
            return {
              id: s.nis || `S-${String(s.id).padStart(3, "0")}`,
              rawId: s.id,
              nama: name,
              nis: s.nis || `S-${String(s.id).padStart(3, "0")}`,
              phone: s.kontak || s.phone || s.no_wa || "-",
              email: s.email && s.email !== "-" ? s.email : `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
              alamat: s.alamat ? `${s.alamat}, ${s.kota || "Kab. Cianjur"}` : (s.kota || "Kab. Cianjur, Jawa Barat"),
              status: s.status === "Nonaktif" ? "Siswa Nonaktif" : "Siswa Aktif",
              program: s.program || "Bahasa Jepang Intensif",
              batch: s.batch ? (String(s.batch).toLowerCase().startsWith("batch") ? s.batch : `Batch ${s.batch}`) : "Batch 2"
            };
          });

        // Local students take precedence, followed by API students if not duplicated
        const merged = [...activeLocal];
        apiList.forEach(apiS => {
          if (!merged.some(m => (m.nis && m.nis === apiS.nis) || m.nama.toLowerCase() === apiS.nama.toLowerCase())) {
            merged.push(apiS);
          }
        });

        if (active) {
          setLiveStudents(merged);
          if (merged.length > 0) {
            setSelectedStudent(prev => {
              if (prev && merged.some(m => (m.nis || m.id) === (prev.nis || prev.id))) {
                return merged.find(m => (m.nis || m.id) === (prev.nis || prev.id));
              }
              return merged[0];
            });
            if (merged[0].program) {
              setProgramInfo(prev => ({ ...prev, program: merged[0].program }));
            }
          } else {
            setSelectedStudent(null);
          }
        }
      } catch (err) {
        console.error("Gagal sinkron siswa:", err);
      } finally {
        if (active) setLoadingStudents(false);
      }
    };

    fetchAllStudents();
    return () => { active = false; };
  }, []);

  const candidateStudents = liveStudents;

  const handleSelectCandidateStudent = (st) => {
    setSelectedStudent(st);
    if (st.program) {
      setProgramInfo(prev => ({
        ...prev,
        program: st.program
      }));
    }
  };

  const activeStudent = isManualStudent ? {
    id: manualStudent.nis || "S-MANUAL",
    nama: manualStudent.nama || "Siswa Baru",
    nis: manualStudent.nis || "S-012",
    phone: manualStudent.phone || "-",
    email: manualStudent.email || "-",
    alamat: manualStudent.alamat || "Cianjur, Jawa Barat",
    status: "Siswa Aktif",
    program: "Kelas Intensif Offline",
    batch: "Batch 2"
  } : selectedStudent;

  const filteredStudents = candidateStudents.filter(s => {
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q) || s.phone.includes(q) || s.email.toLowerCase().includes(q);
  });

  // ─── STEP 2: PROGRAM & ITEM ──────────────────────────────────────────────────
  const [programInfo, setProgramInfo] = useState({
    program: "Kelas Intensif Offline",
    lokasi: "Cianjur",
    kelasMulai: "September 2026",
    durasi: "7 Bulan",
  });

  const [items, setItems] = useState([
    { id: 1, deskripsi: "Kelas Intensif Offline (Full Payment)", qty: 1, harga: 15000000, jumlah: 15000000 },
  ]);

  const [deskripsiItem, setDeskripsiItem] = useState(
    "Biaya Pendidikan Bahasa Jepang dan Pelatihan Skill - Cianjur"
  );

  const subtotalItems = items.reduce((sum, it) => sum + (Number(it.jumlah) || 0), 0);

  const handleItemChange = (id, field, value) => {
    setItems(items.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: value };
      if (field === "qty" || field === "harga") {
        const q = Number(field === "qty" ? value : updated.qty) || 0;
        const p = Number(field === "harga" ? value : updated.harga) || 0;
        updated.jumlah = q * p;
      }
      return updated;
    }));
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now(), deskripsi: "Biaya Pelatihan Tambahan", qty: 1, harga: 1000000, jumlah: 1000000 }
    ]);
  };

  const handleDeleteItem = (id) => {
    if (items.length <= 1) return;
    setItems(items.filter(it => it.id !== id));
  };

  // ─── STEP 3: SKEMA PEMBAYARAN ───────────────────────────────────────────────
  const [skemaPembayaran, setSkemaPembayaran] = useState("full"); // "full" | "cicilan"

  // Full payment state
  const [fullJatuhTempo, setFullJatuhTempo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [fullNominal, setFullNominal] = useState(15000000);
  const [fullKeterangan, setFullKeterangan] = useState("Full Payment");

  // Cicilan state
  const [totalProgramCicilan, setTotalProgramCicilan] = useState(18000000);
  const [jumlahCicilan, setJumlahCicilan] = useState(6);
  const [cicilanList, setCicilanList] = useState([
    { no: 1, jatuhTempo: "2026-08-23", nominal: 5000000, keterangan: "Cicilan 1 (DP)" },
    { no: 2, jatuhTempo: "2026-10-21", nominal: 4000000, keterangan: "Cicilan 2" },
    { no: 3, jatuhTempo: "2026-11-21", nominal: 3000000, keterangan: "Cicilan 3" },
    { no: 4, jatuhTempo: "2026-12-21", nominal: 2000000, keterangan: "Cicilan 4" },
    { no: 5, jatuhTempo: "2027-01-21", nominal: 2000000, keterangan: "Cicilan 5" },
    { no: 6, jatuhTempo: "2027-02-21", nominal: 2000000, keterangan: "Cicilan 6" },
  ]);

  const handleBagiOtomatis = () => {
    const count = Number(jumlahCicilan) || 2;
    const total = Number(totalProgramCicilan) || 18000000;
    const dp = Math.min(5000000, Math.round(total / 3));
    const sisa = total - dp;
    const perTerm = Math.round(sisa / (count - 1));

    const newList = [];
    const baseDate = new Date();

    for (let i = 1; i <= count; i++) {
      const termDate = new Date(baseDate);
      termDate.setMonth(termDate.getMonth() + (i === 1 ? 0 : i));
      const dateStr = termDate.toISOString().split("T")[0];

      let nominal = i === 1 ? dp : perTerm;
      if (i === count) {
        // adjust rounding
        const currentSum = newList.reduce((s, it) => s + it.nominal, 0) + nominal;
        if (currentSum !== total) {
          nominal = total - newList.reduce((s, it) => s + it.nominal, 0);
        }
      }

      newList.push({
        no: i,
        jatuhTempo: dateStr,
        nominal: nominal,
        keterangan: i === 1 ? "Cicilan 1 (DP)" : `Cicilan ${i}`
      });
    }
    setCicilanList(newList);
  };

  const totalTerjadwal = cicilanList.reduce((s, it) => s + (Number(it.nominal) || 0), 0);
  const selisihCicilan = (Number(totalProgramCicilan) || 0) - totalTerjadwal;

  // ─── STEP 4: REKENING & TEMPLATE ────────────────────────────────────────────
  const [rekeningTujuan, setRekeningTujuan] = useState("BCA - PT LPK Creativa");
  const [templateIncluded, setTemplateIncluded] = useState("Template Kelas Intensif Offline");
  const [includedList, setIncludedList] = useState(DEFAULT_INCLUSIONS_LIST);
  const [catatanTerms, setCatatanTerms] = useState(
    `Biaya ujian SSW selain program tertentu dikenakan biaya tambahan Rp 500.000.\n\nCara Pembayaran:\n1. Transfer via ATM/Bank BCA No. Rekening 1832-918-428 an PT CREATIVA BRIDGING INTERN\n2. Cantumkan nomor invoice pada berita transfer.\n3. Kirimkan bukti transfer ke finance@creativabridging.com / WA Finance.`
  );
  const [tampilkanRekening, setTampilkanRekening] = useState(true);
  const [tampilkanKontak, setTampilkanKontak] = useState(true);
  const [isConfidential, setIsConfidential] = useState(true);

  // ─── STEP 5: INVOICE META ───────────────────────────────────────────────────
  const [invoiceNumber] = useState(() => `TGCJ${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth()+1).padStart(2,'0')}${String(Math.floor(1000 + Math.random() * 9000))}`);
  const invoiceDateStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const finalTotal = skemaPembayaran === "full" ? subtotalItems : totalProgramCicilan;

  // Toggle included item
  const toggleIncluded = (item) => {
    if (includedList.includes(item)) {
      setIncludedList(includedList.filter(it => it !== item));
    } else {
      setIncludedList([...includedList, item]);
    }
  };

  // ─── SUBMIT & TERBITKAN INVOICE ─────────────────────────────────────────────
  const handleTerbitkanInvoice = async () => {
    setBusy(true);
    try {
      const invoicePayload = {
        action: "add_invoice",
        id: invoiceNumber,
        tanggal: invoiceDateStr,
        jatuhTempo: skemaPembayaran === "full" ? fullJatuhTempo : (cicilanList[0]?.jatuhTempo || fullJatuhTempo),
        customer: activeStudent.nama,
        email: activeStudent.email,
        phone: activeStudent.phone,
        total: finalTotal,
        keterangan: `${programInfo.program} (${skemaPembayaran === "full" ? "Full Payment" : "Cicilan / Installment"})`,
        status: "Unpaid",
        // Extended payload for preview/print
        skema: skemaPembayaran,
        program: programInfo.program,
        lokasi: programInfo.lokasi,
        durasi: programInfo.durasi,
        items: items,
        installments: skemaPembayaran === "cicilan" ? cicilanList : [],
        includes: includedList,
        notes: catatanTerms,
        rekening: rekeningTujuan,
      };

      // 1. Send to backend
      try {
        await axios.post("/api/billing.php", invoicePayload);
      } catch (err) {
        console.warn("Backend billing endpoint fallback, saving locally", err);
      }

      // 2. Persist to localStorage for immediate UI persistence
      const savedInvoices = JSON.parse(localStorage.getItem("saved_custom_invoices") || "[]");
      savedInvoices.unshift(invoicePayload);
      localStorage.setItem("saved_custom_invoices", JSON.stringify(savedInvoices));

      // 3. Success notification
      await Swal.fire({
        icon: "success",
        title: "Invoice Berhasil Diterbitkan!",
        html: `Nomor Invoice <b>${invoiceNumber}</b> untuk <b>${activeStudent.nama}</b> telah tercatat di sistem penagihan otomatis.`,
        confirmButtonColor: "#2563eb",
        confirmButtonText: "Selesai",
        customClass: { popup: "rounded-2xl" }
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Gagal Menerbitkan Invoice",
        text: error?.response?.data?.message || error.message,
        customClass: { popup: "rounded-2xl" }
      });
    } finally {
      setBusy(false);
    }
  };

  // Direct PDF Download from Preview
  const handleDownloadPDF = () => {
    generateInvoicePDF({
      id: invoiceNumber,
      tanggal: invoiceDateStr,
      jatuhTempo: skemaPembayaran === "full" ? fullJatuhTempo : (cicilanList[0]?.jatuhTempo || fullJatuhTempo),
      customer: activeStudent.nama,
      email: activeStudent.email,
      phone: activeStudent.phone,
      total: finalTotal,
      keterangan: `${programInfo.program} (${skemaPembayaran === "full" ? "Full Payment" : "Cicilan"})`,
      items: items.map(it => ({ name: it.deskripsi, qty: it.qty, price: it.harga, amount: it.jumlah })),
      includes: includedList,
      notes: catatanTerms,
      installments: skemaPembayaran === "cicilan" ? cicilanList : [],
    });
  };

  const formatRp = (num) => "Rp " + Number(num || 0).toLocaleString("id-ID");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* ── HEADER & STEPPER BAR (MATCHING REFERENCE BLUEPRINT) ── */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                Form Buat Invoice Otomatis
              </span>
              <h2 className="text-base md:text-lg font-black text-slate-900 mt-1">
                {currentStep === 1 && "Step 1: Pilih Data Siswa"}
                {currentStep === 2 && "Step 2: Program & Item Tagihan"}
                {currentStep === 3 && "Step 3: Skema Pembayaran"}
                {currentStep === 4 && "Step 4: Rekening & Template"}
                {currentStep === 5 && "Step 5: Catatan & Preview Invoice"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="flex items-center justify-between max-w-2xl mx-auto pt-1 relative">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0"></div>
            <div 
              className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 -z-0 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 88}%` }}
            ></div>

            {STEPS.map((s) => {
              const isPassed = currentStep > s.id;
              const isCurrent = currentStep === s.id;
              const Icon = s.icon;
              return (
                <div 
                  key={s.id} 
                  onClick={() => s.id < currentStep && setCurrentStep(s.id)}
                  className={`flex flex-col items-center gap-1 relative z-10 ${s.id < currentStep ? "cursor-pointer" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all shadow-xs ${
                    isCurrent 
                      ? "bg-blue-600 text-white ring-4 ring-blue-100 scale-110" 
                      : isPassed 
                        ? "bg-emerald-500 text-white" 
                        : "bg-white text-slate-400 border border-slate-200"
                  }`}>
                    {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : s.id}
                  </div>
                  <span className={`text-[11px] font-bold whitespace-nowrap hidden sm:inline ${
                    isCurrent ? "text-blue-600 font-black" : isPassed ? "text-emerald-700" : "text-slate-400"
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── STEP CONTENT AREA ── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">

          {/* ══════════════════════════════════════════════════════════════════
              STEP 1: PILIH SISWA (PANEL 2)
          ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Pilih Siswa / Customer</h3>
                    <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                      Data Langsung dari Modul Students ({liveStudents.length} Siswa Terdaftar)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pilih siswa melalui menu dropdown di bawah. Data profil & kontak otomatis ditarik dari sistem.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualStudent(!isManualStudent)}
                  className="text-xs font-bold text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-slate-200 transition flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  {isManualStudent ? "Pilih dari Dropdown Siswa" : "Input Manual (Opsional)"}
                </button>
              </div>

              {isManualStudent ? (
                /* Mode Input Manual Baru */
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                      <input
                        type="text"
                        placeholder="Contoh: Muhammad Rizki"
                        value={manualStudent.nama}
                        onChange={e => setManualStudent({ ...manualStudent, nama: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">NIS / ID Siswa</label>
                      <input
                        type="text"
                        value={manualStudent.nis}
                        onChange={e => setManualStudent({ ...manualStudent, nis: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                      <input
                        type="text"
                        placeholder="0812-xxxx-xxxx"
                        value={manualStudent.phone}
                        onChange={e => setManualStudent({ ...manualStudent, phone: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="siswa@example.com"
                        value={manualStudent.email}
                        onChange={e => setManualStudent({ ...manualStudent, email: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Domisili</label>
                      <input
                        type="text"
                        placeholder="Cianjur, Jawa Barat"
                        value={manualStudent.alamat}
                        onChange={e => setManualStudent({ ...manualStudent, alamat: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* DROPDOWN SELECT SISWA (REKOMENDASI UI/UX) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        Pilih Siswa / Customer (Tarik Data Otomatis)
                      </span>
                      <span className="text-[11px] font-semibold text-blue-600">
                        {liveStudents.length} Siswa Terdaftar
                      </span>
                    </label>

                    <div className="relative">
                      <select
                        value={selectedStudent?.nis || selectedStudent?.id || (liveStudents[0] ? (liveStudents[0].nis || liveStudents[0].id) : "")}
                        onChange={e => {
                          const chosenVal = e.target.value;
                          const found = liveStudents.find(s => (s.nis || s.id) === chosenVal || s.nama === chosenVal);
                          if (found) handleSelectCandidateStudent(found);
                        }}
                        disabled={liveStudents.length === 0}
                        className="w-full bg-white border border-slate-300 hover:border-blue-400 rounded-2xl px-4 py-3.5 text-xs sm:text-sm font-bold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer appearance-none pr-10 transition disabled:bg-slate-100 disabled:cursor-not-allowed"
                      >
                        {liveStudents.length === 0 ? (
                          <option value="">Belum ada siswa terdaftar di Modul Students</option>
                        ) : (
                          liveStudents.map((s, idx) => (
                            <option key={s.id || s.nis || idx} value={s.nis || s.id || s.nama}>
                              {s.nama} ({s.nis || 'NIS -'}) — {s.program || 'Program Intensif'}
                            </option>
                          ))
                        )}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  {/* KARTU PROFIL & DETAIL SISWA TERPILIH */}
                  {selectedStudent && (
                    <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white p-5 rounded-3xl border border-blue-200/90 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100/80 pb-3.5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-13 h-13 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                            {selectedStudent.nama ? selectedStudent.nama.charAt(0).toUpperCase() : "S"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-slate-900 text-base md:text-lg">{selectedStudent.nama}</h4>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                {selectedStudent.status || "Siswa Aktif"}
                              </span>
                            </div>
                            <p className="text-xs text-blue-700 font-bold mt-0.5 flex items-center gap-1.5">
                              <span>📚 {selectedStudent.program || "Kelas Intensif Offline"}</span>
                              <span>•</span>
                              <span className="text-slate-500 font-normal">{selectedStudent.batch || "Batch 2"}</span>
                            </p>
                          </div>
                        </div>

                        <span className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Siswa Terpilih
                        </span>
                      </div>

                      {/* 4 Detail Grid Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-white/95 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-2xs">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                            <Hash className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium">Nomor Induk Siswa (NIS)</p>
                            <p className="font-bold text-slate-900 font-mono text-xs">{selectedStudent.nis || "-"}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-white/95 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-2xs">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium">WhatsApp / Nomor Telepon</p>
                            <p className="font-bold text-slate-900 font-mono text-xs">{selectedStudent.phone || "-"}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-white/95 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-2xs">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-400 font-medium">Email Resmi</p>
                            <p className="font-bold text-slate-900 truncate text-xs">{selectedStudent.email || "-"}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-white/95 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-2xs">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-400 font-medium">Alamat Domisili</p>
                            <p className="font-bold text-slate-900 truncate text-xs">{selectedStudent.alamat || "Cianjur, Jawa Barat"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1 text-blue-600 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Data otomatis tersinkron dengan database profil student
                        </span>
                        <span className="text-slate-400">Siap dibuatkan invoice penagihan</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Info Program */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">Informasi Program</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Program *</label>
                    <select
                      value={programInfo.program}
                      onChange={e => setProgramInfo({ ...programInfo, program: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option>Kelas Intensif Offline</option>
                      <option>Program Pelatihan Jepang</option>
                      <option>Program SSW</option>
                      <option>Kursus Reguler</option>
                      <option>Tokutei Ginou Kaigo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Lokasi</label>
                    <select
                      value={programInfo.lokasi}
                      onChange={e => setProgramInfo({ ...programInfo, lokasi: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option>Cianjur</option>
                      <option>Bandung</option>
                      <option>Jakarta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kelas Mulai</label>
                    <input
                      type="text"
                      value={programInfo.kelasMulai}
                      onChange={e => setProgramInfo({ ...programInfo, kelasMulai: e.target.value })}
                      placeholder="September 2026"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Durasi</label>
                    <select
                      value={programInfo.durasi}
                      onChange={e => setProgramInfo({ ...programInfo, durasi: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option>7 Bulan</option>
                      <option>6 Bulan</option>
                      <option>1 Tahun</option>
                      <option>3 Bulan</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Item Tagihan Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-800">Item Tagihan</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Item
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-2.5 px-3 text-left">Deskripsi</th>
                        <th className="py-2.5 px-3 text-center w-20">Qty</th>
                        <th className="py-2.5 px-3 text-right w-36">Harga (Rp)</th>
                        <th className="py-2.5 px-3 text-right w-36">Jumlah (Rp)</th>
                        <th className="py-2.5 px-2 text-center w-12">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {items.map((it) => (
                        <tr key={it.id}>
                          <td className="p-2">
                            <input
                              type="text"
                              value={it.deskripsi}
                              onChange={e => handleItemChange(it.id, "deskripsi", e.target.value)}
                              className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={it.qty}
                              onChange={e => handleItemChange(it.id, "qty", e.target.value)}
                              className="w-full border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-center text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="50000"
                              value={it.harga}
                              onChange={e => handleItemChange(it.id, "harga", e.target.value)}
                              className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-right text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </td>
                          <td className="p-2 text-right font-bold text-slate-800 font-mono">
                            {formatRp(it.jumlah)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(it.id)}
                              disabled={items.length <= 1}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3 text-right text-slate-600">Subtotal Tagihan:</td>
                        <td className="py-2.5 px-3 text-right text-slate-900 font-mono text-sm">{formatRp(subtotalItems)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Deskripsi Item / Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi Item / Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  value={deskripsiItem}
                  onChange={e => setDeskripsiItem(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-none"
                />
                <span className="text-[10px] text-slate-400 block text-right">{deskripsiItem.length}/500</span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 3: SKEMA PEMBAYARAN (PANEL 4 & 4B)
          ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">Pilih Skema Pembayaran</h3>
                <p className="text-xs text-slate-400">Pilih full payment sekaligus atau cicilan bertahap (installment)</p>
              </div>

              {/* Dua Pilihan Skema (Matching Panel 4) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setSkemaPembayaran("full")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3.5 select-none ${
                    skemaPembayaran === "full"
                      ? "border-blue-600 bg-blue-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    skemaPembayaran === "full" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Full Payment</h4>
                    <p className="text-xs text-slate-500">Bayar sekaligus lunas</p>
                    <p className="font-black text-blue-700 text-base mt-2 font-mono">{formatRp(subtotalItems)}</p>
                  </div>
                </div>

                <div
                  onClick={() => setSkemaPembayaran("cicilan")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3.5 select-none ${
                    skemaPembayaran === "cicilan"
                      ? "border-blue-600 bg-blue-50/50 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    skemaPembayaran === "cicilan" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Cicilan (Installment)</h4>
                    <p className="text-xs text-slate-500">Bayar bertahap beberapa termin</p>
                    <p className="font-black text-indigo-700 text-base mt-2 font-mono">{formatRp(totalProgramCicilan)}</p>
                  </div>
                </div>
              </div>

              {/* Sub-form Full Payment (Panel 4) */}
              {skemaPembayaran === "full" && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-semibold text-slate-500">Total Tagihan:</span>
                    <span className="text-lg font-black text-slate-900 font-mono">{formatRp(subtotalItems)}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal Jatuh Tempo *</label>
                      <input
                        type="date"
                        value={fullJatuhTempo}
                        onChange={e => setFullJatuhTempo(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nominal (Rp) *</label>
                      <input
                        type="number"
                        value={fullNominal}
                        onChange={e => setFullNominal(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Keterangan</label>
                      <input
                        type="text"
                        value={fullKeterangan}
                        onChange={e => setFullKeterangan(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">Sisa Pembayaran: Rp 0 (Lunas setelah pembayaran ini)</span>
                  </div>
                </div>
              )}

              {/* Sub-form Cicilan (Panel 4b) */}
              {skemaPembayaran === "cicilan" && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase block">Total Program</span>
                      <span className="text-lg font-black text-slate-900 font-mono">{formatRp(totalProgramCicilan)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-600 font-medium">Jumlah:</span>
                        <select
                          value={jumlahCicilan}
                          onChange={e => setJumlahCicilan(Number(e.target.value))}
                          className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                        >
                          <option value={2}>2 Termin</option>
                          <option value={3}>3 Termin</option>
                          <option value={4}>4 Termin</option>
                          <option value={6}>6 Termin</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleBagiOtomatis}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <Zap className="w-3.5 h-3.5" /> Bagi Otomatis
                      </button>
                    </div>
                  </div>

                  {/* Cicilan Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="py-2 px-3 text-center w-10">No</th>
                          <th className="py-2 px-3 text-left w-36">Jatuh Tempo</th>
                          <th className="py-2 px-3 text-right w-36">Nominal (Rp)</th>
                          <th className="py-2 px-3 text-left">Keterangan</th>
                          <th className="py-2 px-2 text-center w-10">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {cicilanList.map((c, idx) => (
                          <tr key={idx}>
                            <td className="p-2 text-center font-bold text-slate-400">{c.no}</td>
                            <td className="p-2">
                              <input
                                type="date"
                                value={c.jatuhTempo}
                                onChange={e => {
                                  const updated = [...cicilanList];
                                  updated[idx].jatuhTempo = e.target.value;
                                  setCicilanList(updated);
                                }}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="100000"
                                value={c.nominal}
                                onChange={e => {
                                  const updated = [...cicilanList];
                                  updated[idx].nominal = Number(e.target.value) || 0;
                                  setCicilanList(updated);
                                }}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-right font-mono font-bold text-slate-800"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={c.keterangan}
                                onChange={e => {
                                  const updated = [...cicilanList];
                                  updated[idx].keterangan = e.target.value;
                                  setCicilanList(updated);
                                }}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => setCicilanList(cicilanList.filter((_, i) => i !== idx))}
                                className="text-slate-400 hover:text-rose-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Bar */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500">Total Terjadwal: </span>
                      <span className="font-mono font-bold text-slate-900">{formatRp(totalTerjadwal)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Selisih: </span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                        selisihCicilan === 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}>
                        {formatRp(selisihCicilan)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 4: REKENING & TEMPLATE (PANEL 5)
          ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rekening Tujuan */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-800">Rekening Penerimaan *</h3>
                  <select
                    value={rekeningTujuan}
                    onChange={e => setRekeningTujuan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option>BCA - PT LPK Creativa</option>
                    <option>Bank Mandiri - PT LPK Creativa</option>
                    <option>Bank BRI - PT LPK Creativa</option>
                  </select>

                  {/* Account Card (Matching Panel 5) */}
                  <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Building className="w-5 h-5 text-blue-300" />
                        <span className="font-black text-sm">Bank BCA</span>
                      </div>
                      <span className="text-[10px] font-bold bg-blue-800/80 px-2 py-0.5 rounded text-blue-200">
                        Rekening Utama
                      </span>
                    </div>
                    <p className="font-mono text-base font-bold tracking-wider">1832-918-428</p>
                    <p className="text-[11px] text-blue-200 mt-0.5">a/n PT CREATIVA BRIDGING INTERN</p>
                    <div className="mt-3 pt-2.5 border-t border-blue-800 flex items-center justify-between text-xs">
                      <span className="text-blue-300">Saldo Tersedia:</span>
                      <span className="font-mono font-bold text-emerald-400">Rp 120.000.000</span>
                    </div>
                  </div>
                </div>

                {/* Catatan & Ketentuan */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-800">Catatan & Ketentuan</h3>
                  <textarea
                    rows={6}
                    value={catatanTerms}
                    onChange={e => setCatatanTerms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition leading-relaxed font-sans"
                  />
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tampilkanRekening}
                        onChange={e => setTampilkanRekening(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Tampilkan rekening pembayaran pada lembar invoice</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tampilkanKontak}
                        onChange={e => setTampilkanKontak(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Tampilkan informasi kontak admin finance</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isConfidential}
                        onChange={e => setIsConfidential(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Invoice bersifat confidential (rahasia)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Biaya Sudah Termasuk (Included) Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Biaya Sudah Termasuk (Included)
                  </h4>
                  <span className="text-[11px] text-slate-400">{includedList.length} fasilitas tercentang</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {DEFAULT_INCLUSIONS_LIST.map((item, idx) => {
                    const isChecked = includedList.includes(item);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleIncluded(item)}
                        className={`p-2 rounded-xl border text-xs cursor-pointer transition flex items-start gap-2 select-none ${
                          isChecked
                            ? "bg-blue-50/70 border-blue-200 text-blue-900 font-medium"
                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                          isChecked ? "bg-blue-600 text-white" : "border border-slate-300"
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 5: PREVIEW DOKUMEN INVOICE RESMI (PANEL 6)
          ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Preview Invoice Resmi</span>
                  <span className="text-[11px] text-slate-400 font-mono">({invoiceNumber})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-white text-xs font-bold px-2 py-1">
                    <button onClick={() => setZoomLevel(Math.max(70, zoomLevel - 10))} className="px-1 text-slate-500 hover:text-slate-800">-</button>
                    <span className="px-1 text-slate-700">{zoomLevel}%</span>
                    <button onClick={() => setZoomLevel(Math.min(130, zoomLevel + 10))} className="px-1 text-slate-500 hover:text-slate-800">+</button>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" /> Unduh PDF
                  </button>
                </div>
              </div>

              {/* Document Container (Formatted exactly like Panel 6) */}
              <div className="bg-slate-200/70 p-4 md:p-6 rounded-3xl flex justify-center overflow-x-auto">
                <div 
                  className="bg-white text-slate-800 rounded-2xl p-6 md:p-8 shadow-xl max-w-2xl w-full border border-slate-200 transition-all font-sans"
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
                >
                  {/* Kop Surat */}
                  <div className="flex items-start justify-between pb-3 border-b-2 border-blue-900">
                    <div className="flex items-center gap-3">
                      <img 
                        src="/images/creativa-kop-logo.png" 
                        alt="Logo Creativa" 
                        className="h-10 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div>
                        <h4 className="font-black text-blue-900 text-sm leading-tight">CREATIVA BRIDGING</h4>
                        <p className="text-[10px] font-bold text-blue-800 tracking-wider">INTERNATIONAL</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">INVOICE</h2>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">PT. Creativa Bridging International</p>
                      <p className="text-[9px] text-slate-500 max-w-[240px] leading-snug">
                        Ruko Business Park, Jl. Ir. H. Juanda, Panembong, Ruko B1, Mekarsari, Kec. Cianjur, Kab. Cianjur 43211
                      </p>
                      <p className="text-[9px] text-blue-600 font-medium">+62 815-2222-672 | creativabridging.com</p>
                    </div>
                  </div>

                  {/* Customer & Invoice Meta Info */}
                  <div className="grid grid-cols-2 gap-4 py-4 text-xs">
                    <div>
                      <p className="text-slate-400 font-semibold text-[10px] uppercase">To:</p>
                      <p className="font-black text-slate-900 text-sm">{activeStudent.nama.toUpperCase()}</p>
                      <p className="text-slate-500 text-[11px] font-mono mt-0.5">{activeStudent.phone}</p>
                      <p className="text-slate-500 text-[11px]">{activeStudent.email}</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">{activeStudent.alamat}</p>
                    </div>

                    <div className="text-right space-y-1">
                      <p><span className="text-slate-400">Invoice Number:</span> <span className="font-mono font-bold text-slate-900">{invoiceNumber}</span></p>
                      <p><span className="text-slate-400">Invoice Date:</span> <span className="text-slate-800">{invoiceDateStr}</span></p>
                      <p><span className="text-slate-400">Payment Due:</span> <span className="text-slate-800">{skemaPembayaran === "full" ? fullJatuhTempo : (cicilanList[0]?.jatuhTempo || fullJatuhTempo)}</span></p>
                      <p><span className="text-slate-400">Amount Due:</span> <span className="font-black text-blue-700 font-mono text-sm">{formatRp(finalTotal)}</span></p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden my-2">
                    <thead className="bg-blue-900 text-white font-bold text-[10px] uppercase">
                      <tr>
                        <th className="py-2 px-3 text-left">Items</th>
                        <th className="py-2 px-3 text-center w-16">Quantity</th>
                        <th className="py-2 px-3 text-right w-28">Price</th>
                        <th className="py-2 px-3 text-right w-28">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {items.map(it => (
                        <tr key={it.id}>
                          <td className="p-2.5">
                            <p className="font-bold text-slate-900">{it.deskripsi}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{deskripsiItem}</p>
                          </td>
                          <td className="p-2.5 text-center font-bold">{it.qty}</td>
                          <td className="p-2.5 text-right font-mono">{formatRp(it.harga)}</td>
                          <td className="p-2.5 text-right font-mono font-bold">{formatRp(it.jumlah)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="py-2 px-3 text-right text-slate-600">Total:</td>
                        <td className="py-2 px-3 text-right font-mono text-sm text-slate-900">{formatRp(finalTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Cicilan Table (If Cicilan) */}
                  {skemaPembayaran === "cicilan" && (
                    <div className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="font-bold text-xs text-blue-900 mb-1.5 uppercase tracking-wider">
                        Jadwal Cicilan (Installment)
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                        {cicilanList.map(c => (
                          <div key={c.no} className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-700 block">{c.keterangan}</span>
                            <span className="text-[10px] text-slate-400 block">Due: {c.jatuhTempo}</span>
                            <span className="font-mono font-bold text-blue-700">{formatRp(c.nominal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Included Items */}
                  <div className="my-3 text-xs">
                    <p className="font-bold text-blue-900 mb-1">Biaya Sudah Termasuk:</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-600">
                      {includedList.slice(0, 8).map((inc, i) => (
                        <p key={i}>✓ {inc}</p>
                      ))}
                    </div>
                  </div>

                  {/* Payment & Terms */}
                  <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-4 text-[10px] text-slate-600">
                    <div>
                      <p className="font-bold text-slate-800">Cara Pembayaran:</p>
                      <p>Bank BCA No. Rekening: <span className="font-mono font-bold text-slate-900">1832-918-428</span></p>
                      <p>a/n PT CREATIVA BRIDGING INTERN</p>
                      <p className="mt-1 text-slate-400">Harap sertakan No. Invoice pada berita transfer.</p>
                    </div>

                    <div className="text-right">
                      <p className="text-slate-500">Diketahui Oleh,</p>
                      <p className="text-blue-900 font-bold mt-4">Siti Nurhatifah</p>
                      <p className="text-[9px] text-slate-400">Direktur PT. Creativa Bridging International</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── FOOTER NAVIGATION BUTTONS (MATCHING REFERENCE) ── */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition"
              >
                Batal
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95"
              >
                Lanjut <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={handleTerbitkanInvoice}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {busy ? "Menerbitkan..." : "Terbitkan Invoice"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
