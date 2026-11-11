import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  BookOpen,
  CreditCard,
  Landmark,
  FileText,
  Search,
  Plus,
  Trash2,
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
import {
  generateInvoicePDF,
  formatRpNoDecimals,
  formatRpComma,
  formatInvoiceDateShort,
  formatInvoiceDateUpper,
  createDirectorStampDataURL,
} from "../pages/InvoicePenagihan";

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
        const cleanNis = s.nis ? (String(s.nis).startsWith("CB-") ? String(s.nis).replace(/^CB-/, "TGCJ2610") : s.nis) : `S-${String(s.id).padStart(3, "0")}`;
        return {
          id: cleanNis,
          rawId: s.id,
          nama: name,
          nis: cleanNis,
          phone: s.kontak || s.phone || s.no_wa || "0812-xxxx-xxxx",
          email: s.email && s.email !== "-" ? s.email : `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
          alamat: s.alamat ? `${s.alamat}, ${s.kota || "Kab. Cianjur"}` : (s.kota || "Kab. Cianjur, Jawa Barat"),
          status: s.status === "Nonaktif" ? "Siswa Nonaktif" : (s.status || "Siswa Aktif"),
          program: s.program || "Intensif Offline",
          metodePembayaran: s.metodePembayaran || s.metode_pembayaran || s.tipe_pembayaran || "",
          totalBiaya: Number(s.totalBiaya || s.total_biaya || 0),
          batch: s.batch ? (String(s.batch).toLowerCase().startsWith("batch") ? s.batch : `Batch ${s.batch}`) : "2",
          fromWeb: Boolean(s.fromWeb),
        };
      });
  } catch (e) {
    return [];
  }
}

// ─── HELPERS: MAPPING PROGRAM & METODE PEMBAYARAN DARI PENDAFTARAN WEB ───────
function normalizeProgramOption(rawProgram = "") {
  const p = String(rawProgram || "").trim().toLowerCase();
  if (!p) return "Intensif Offline";
  if (p.includes("kaigo") || p.includes("talang")) return "Kaigo Dana Talang";
  if (p.includes("intensif") || p.includes("lanjutan")) return "Intensif Offline";
  if (p.includes("matching")) return "Matching Job";
  if (p.includes("sotsu")) return "Sotsugyousei";
  if (p.includes("reguler")) return "Kursus Reguler";
  if (p.includes("pelatihan jepang")) return "Program Pelatihan Jepang";
  return rawProgram;
}

function normalizePaymentScheme(rawScheme = "", rawProgram = "") {
  const combined = `${rawScheme || ""} ${rawProgram || ""}`.toLowerCase();
  if (combined.includes("cicil") || combined.includes("installment") || combined.includes("angsur")) {
    return "cicilan";
  }
  return "full";
}

function buildInvoiceProgramPreset(programName, skema = "full", overrideTotal = 0) {
  const normProg = normalizeProgramOption(programName);
  const pLower = String(normProg || "").toLowerCase();
  const isCicilan = skema === "cicilan";
  const skemaLabel = isCicilan ? "Cicilan" : "Full Payment";
  const customAmt = Number(overrideTotal || 0);

  if (pLower.includes("kaigo") || pLower.includes("talang")) {
    return {
      program: "Kaigo Dana Talang",
      durasi: "6 Bulan",
      deskripsi: `Program Kaigo Dana Talang (${skemaLabel})`,
      subdeskripsi: "Biaya Pendidikan, Pelatihan Kaigo & Fasilitas Dana Talang",
      harga: customAmt > 0 ? customAmt : 17760000,
    };
  }
  if (pLower.includes("matching")) {
    return {
      program: "Matching Job",
      durasi: "4 Bulan",
      deskripsi: `Program Matching Job (${skemaLabel})`,
      subdeskripsi: "Biaya Program Penempatan Kerja Jepang & Pengurusan Dokumen",
      harga: customAmt > 0 ? customAmt : 25000000,
    };
  }
  if (pLower.includes("sotsu")) {
    return {
      program: "Sotsugyousei",
      durasi: "4 Bulan",
      deskripsi: `Program Sotsugyousei (${skemaLabel})`,
      subdeskripsi: "Biaya Program Eks-Pemagang / Lanjutan Jepang",
      harga: customAmt > 0 ? customAmt : 7500000,
    };
  }
  if (pLower.includes("reguler")) {
    return {
      program: "Kursus Reguler",
      durasi: "4 Bulan",
      deskripsi: `Kursus Bahasa Jepang Reguler (${skemaLabel})`,
      subdeskripsi: "Biaya Pendidikan Kelas Reguler Bahasa Jepang",
      harga: customAmt > 0 ? customAmt : 5000000,
    };
  }

  return {
    program: normProg,
    durasi: "7 Bulan",
    deskripsi: `${normProg} (${skemaLabel})`,
    subdeskripsi: isCicilan
      ? "Biaya Pendidikan Bahasa Jepang & Pelatihan Skill - Cianjur (Skema Cicilan)"
      : "Biaya Pendidikan Bahasa Jepang dan Pelatihan Skill - Cianjur",
    harga: customAmt > 0 ? customAmt : (isCicilan ? 18000000 : 15000000),
  };
}

// ─── SYNCHRONOUS BANK & COA ACCOUNT LOADER ──────────────────────────────────
function getStoredBankAccounts() {
  const accounts = [];
  try {
    // 1. Ambil dari Master Rekening (RekeningPage / finance_rekening_data)
    const savedRekening = localStorage.getItem("finance_rekening_data");
    if (savedRekening) {
      const parsed = JSON.parse(savedRekening);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.filter(r => r.status === "Aktif" && (r.jenis === "Bank" || !r.jenis)).forEach(r => {
          let bName = r.bank ? r.bank.replace(/^bank\s+/i, "") : "BCA";
          // Sanitize: corporate invoice collection bank is BCA
          if (bName.toLowerCase().includes("bca") || (r.noRek && r.noRek.includes("1832-918-428"))) {
            bName = "BCA";
          }
          let cCode = r.kode || (bName.toLowerCase().includes("bca") ? "1002" : bName.toLowerCase().includes("mandiri") ? "1003" : "1004");
          accounts.push({
            id: `rek-${r.id}`,
            rawId: r.id,
            kode: cCode,
            nama: r.nama || `Bank ${bName}`,
            bank: bName,
            noRek: r.noRek || "1832-918-428",
            pemilik: r.pemilik || "PT LPK Creativa",
            saldo: Number(r.saldo || 0),
            jenis: r.jenis || "Bank"
          });
        });
      }
    }

    // 2. Ambil dari Master COA (CoaPage / finance_coa_data) kategori Cash and Bank / AST-CB
    const savedCoa = localStorage.getItem("finance_coa_data");
    if (savedCoa) {
      const parsedCoa = JSON.parse(savedCoa);
      if (Array.isArray(parsedCoa) && parsedCoa.length > 0) {
        parsedCoa
          .filter(c => (c.kategori === "Cash and Bank" || c.subtype === "AST-CB") && c.status !== "Nonaktif")
          .forEach(c => {
            // Cek apakah akun dengan kode atau nama ini sudah ada di accounts
            if (!accounts.some(a => a.kode === c.kode || a.nama.toLowerCase() === c.nama.toLowerCase())) {
              let bankName = "BCA";
              const textCheck = `${c.nama || ''} ${c.rekeningDetail || ''}`.toLowerCase();
              if (textCheck.includes('mandiri')) bankName = "Mandiri";
              else if (textCheck.includes('bni')) bankName = "BNI";
              else if (/\bbank\s+bri\b/i.test(textCheck) && !textCheck.includes('bridging')) bankName = "BRI";
              else bankName = "BCA";

              let noRek = "1832-918-428";
              const matchNo = (c.rekeningDetail || "").match(/\b[\d-]{7,20}\b/);
              if (matchNo) noRek = matchNo[0];

              accounts.push({
                id: `coa-${c.kode || c.id}`,
                rawId: c.id,
                kode: c.kode || "1002",
                nama: c.nama,
                bank: bankName,
                noRek: noRek,
                pemilik: "PT LPK Creativa",
                saldo: Number(c.saldo || 0),
                jenis: "Bank"
              });
            }
          });
      }
    }
  } catch (e) {
    console.warn("Gagal membaca master rekening/COA:", e);
  }

  // Fallback standar resmi jika storage belum terinisialisasi
  if (accounts.length === 0) {
    return [
      { id: "coa-1002", rawId: 2, kode: "1002", nama: "Bank BCA Operasional", bank: "BCA", noRek: "1832-918-428", pemilik: "PT LPK Creativa", saldo: 145200000, jenis: "Bank" },
      { id: "coa-1003", rawId: 3, kode: "1003", nama: "Bank Mandiri Utama", bank: "Mandiri", noRek: "130-0019283", pemilik: "PT LPK Creativa", saldo: 78500000, jenis: "Bank" },
      { id: "coa-1004", rawId: 4, kode: "1004", nama: "Bank BNI Tabungan", bank: "BNI", noRek: "088-771122", pemilik: "PT LPK Creativa", saldo: 35000000, jenis: "Bank" },
    ];
  }

  // Pastikan akun utama BCA 1832-918-428 selalu berada di urutan pertama (prioritas tagihan siswa)
  const bcaIdx = accounts.findIndex(a => a.bank === "BCA" || a.kode === "1002" || String(a.noRek || '').includes("1832-918-428"));
  if (bcaIdx > 0) {
    const [bcaAcc] = accounts.splice(bcaIdx, 1);
    accounts.unshift(bcaAcc);
  }

  return accounts;
}

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
  "Biaya ujian SSW selain program SSW kaigo, pengolahan makanan, pertanian, perikanan, dan restoran dikenakan biaya tambahan Rp 500.000.",
  "Invoice bersifat confidential (rahasia)"
];

const formatRp = (num) => {
  return "Rp " + Number(num || 0).toLocaleString("id-ID");
};

export default function BuatInvoiceWizardModal({ onClose, onSuccess, dataSiswa = [] }) {
  const [busy, setBusy] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // ─── 1. INFORMASI INVOICE ──────────────────────────────────────────────────
  const [invoiceNumber, setInvoiceNumber] = useState(() => `TGCJ${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(Math.floor(1000 + Math.random() * 9000))}`);
  const [salesCode, setSalesCode] = useState("LPK-2026-08");
  const [tanggalInvoice, setTanggalInvoice] = useState(() => new Date().toISOString().split("T")[0]);
  const [jatuhTempo, setJatuhTempo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });

  // ─── 2. DATA SISWA (REAL TIME SYNC DENGAN STUDENTS MODULE) ──────────────────
  const [liveStudents, setLiveStudents] = useState(() => getStoredLocalStudents());
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
    program: "Intensif Offline",
    metodePembayaran: "Full Payment",
    batch: "2"
  });

  // Fetch live students from DB & LocalStorage without dummy fallback
  useEffect(() => {
    let active = true;
    const fetchStudents = async () => {
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
          const res = await axios.get("/api/accounting.php", {
            params: { view: "lookups", _t: Date.now() }
          });
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
                  status: s.status === "Nonaktif" ? "Siswa Nonaktif" : (s.status || "Siswa Aktif"),
                  program: s.program || "Intensif Offline",
                  metodePembayaran: s.metode_pembayaran || s.tipe_pembayaran || s.metodePembayaran || "",
                  totalBiaya: Number(s.total_biaya || 0),
                  batch: s.batch ? String(s.batch).replace(/^batch\s*/i, "") : "2",
                  fromWeb: true,
                };
              });
          }
        } catch (e) {
          console.warn("Lookups fallback:", e);
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
              status: s.status === "Nonaktif" ? "Siswa Nonaktif" : (s.status || "Siswa Aktif"),
              program: s.program || "Intensif Offline",
              metodePembayaran: s.metodePembayaran || s.metode_pembayaran || s.tipe_pembayaran || "",
              totalBiaya: Number(s.totalBiaya || s.total_biaya || 0),
              batch: s.batch ? String(s.batch).replace(/^batch\s*/i, "") : "2",
              fromWeb: Boolean(s.fromWeb),
            };
          });

        // Prioritaskan data terbaru dari database server agar sinkron antar perangkat
        const merged = [...apiList];
        activeLocal.forEach(locS => {
          if (!merged.some(m => (m.nis && locS.nis && m.nis === locS.nis) || m.nama.toLowerCase() === locS.nama.toLowerCase())) {
            merged.push(locS);
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
          } else {
            setSelectedStudent(null);
          }
        }
      } catch (err) {
        console.error("Gagal sinkron siswa:", err);
      }
    };

    fetchStudents();
    return () => { active = false; };
  }, []);

  // ─── TARIK DATA PESERTA DARI CREATIVABRIDGING.COM ───────────────────────────
  const [isSyncingPeserta, setIsSyncingPeserta] = useState(false);

  const handleSyncPesertaFromWeb = async () => {
    setIsSyncingPeserta(true);
    try {
      const response = await axios.post("/api/sync_students_web.php", {});
      const students = response.data?.students;
      if (response.data?.status !== "success" || !Array.isArray(students)) {
        throw new Error(response.data?.message || "Gagal mendapatkan data peserta.");
      }

      const deletedIds = JSON.parse(localStorage.getItem("deleted_students_finance") || "[]");

      const formattedParticipants = students
        .filter(p => {
          const webId = p.web_id || p.id;
          return (p.nama || p.name || p.nama_lengkap) &&
            !deletedIds.includes(webId) &&
            !deletedIds.includes(String(webId)) &&
            !deletedIds.includes(`CB-${webId}`);
        })
        .map(p => {
          const rawId = p.web_id || p.id;
          const pName = (p.nama || p.name || p.nama_lengkap).trim();
          const nisCode = p.nis || `S-${String(rawId).padStart(3, "0")}`;
          const cleanPhone = p.phone || p.no_wa || p.kontak || "";
          const cleanEmail = p.email || "";
          const address = p.alamat || [p.kotaDomisili || p.kota, p.lokasiTinggal].filter(Boolean).join(", ") || "Cianjur, Jawa Barat";
          const status = p.status || "Aktif";
          const metode = p.metode_pembayaran || p.metodePembayaran || p.tipe_pembayaran || "";

          return {
            id: nisCode,
            rawId: rawId,
            nama: pName,
            nis: nisCode,
            phone: cleanPhone || "0812-xxxx-xxxx",
            email: cleanEmail,
            alamat: address,
            status: status === "Pembayaran" || status === "Menunggu Pembayaran" ? "Menunggu Pembayaran" : `Siswa (${status})`,
            program: p.program || "Intensif Offline",
            metodePembayaran: metode,
            totalBiaya: Number(p.total_biaya || 0),
            batch: String(p.batch || "2").replace(/^batch\s*/i, ""),
            noKtp: p.noKtp || p.no_ktp || "",
            fromWeb: true
          };
        });

      const nonWebStudents = liveStudents.filter(s => !s.fromWeb);
      const mergedList = [...formattedParticipants, ...nonWebStudents];

      localStorage.setItem("local_only_students_finance", JSON.stringify(formattedParticipants));
      setLiveStudents(mergedList);

      // Pilih peserta yang sama (jika masih ada) atau peserta terbaru agar program & pembayarannya langsung menyesuaikan
      if (mergedList.length > 0) {
        const curMatch = selectedStudent
          ? mergedList.find(m => (m.nis && selectedStudent.nis && m.nis === selectedStudent.nis) || m.nama.toLowerCase() === (selectedStudent.nama || "").toLowerCase())
          : null;
        const targetStudent = curMatch || mergedList[0];
        setSelectedStudent(targetStudent);
        if (!isManualStudent) {
          applyStudentToInvoice(targetStudent);
        }
      }

      Swal.fire({
        icon: "success",
        title: "Sinkronisasi Berhasil!",
        html: `Berhasil menarik <b>${formattedParticipants.length} siswa</b> beserta pilihan program & metode pembayarannya dari <code>creativabridging.com</code>. Form invoice otomatis disesuaikan.`,
        customClass: { popup: "rounded-2xl" },
        confirmButtonColor: "#2563eb"
      });
    } catch (err) {
      console.error("Gagal sinkron data peserta:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Menarik Data",
        text: err.response?.data?.message || err.message || "Pastikan koneksi internet aktif dan endpoint creativabridging.com dapat diakses.",
        customClass: { popup: "rounded-2xl" }
      });
    } finally {
      setIsSyncingPeserta(false);
    }
  };

  const activeStudent = isManualStudent ? {
    id: manualStudent.nis || "S-MANUAL",
    nama: manualStudent.nama || "Siswa Baru",
    nis: manualStudent.nis || "S-001",
    phone: manualStudent.phone || "-",
    email: manualStudent.email || "-",
    alamat: manualStudent.alamat || "Cianjur, Jawa Barat",
    status: "Siswa Aktif",
    program: manualStudent.program || "Intensif Offline",
    metodePembayaran: manualStudent.metodePembayaran || "Full Payment",
    totalBiaya: 0,
    batch: manualStudent.batch || "2",
    fromWeb: false,
  } : (selectedStudent || {
    id: "S-001",
    nama: "Belum Ada Siswa Terpilih",
    nis: "-",
    phone: "-",
    email: "-",
    alamat: "-",
    status: "Nonaktif",
    program: "Intensif Offline",
    metodePembayaran: "",
    totalBiaya: 0,
    batch: "2",
    fromWeb: false,
  });

  // ─── 3. PROGRAM & ITEM TAGIHAN ──────────────────────────────────────────────
  const [programInfo, setProgramInfo] = useState({
    program: "Intensif Offline",
    lokasi: "Cianjur",
    durasi: "7 Bulan",
  });

  const [items, setItems] = useState([
    {
      id: 1,
      deskripsi: "Intensif Offline (Full Payment)",
      subdeskripsi: "Biaya Pendidikan Bahasa Jepang dan Pelatihan Skill - Cianjur",
      harga: 15000000,
      diskon: 0,
      jumlah: 15000000,
    },
  ]);

  // ─── 4. SKEMA PEMBAYARAN ────────────────────────────────────────────────────
  const [metodePembayaran, setMetodePembayaran] = useState("Transfer Bank");
  const [skemaPembayaran, setSkemaPembayaran] = useState("full"); // "full" | "cicilan"

  // Sinkronkan program, nominal, dan skema pembayaran otomatis dari data pendaftar
  const applyStudentToInvoice = (student) => {
    if (!student) return;
    const rawProg = student.program || "Intensif Offline";
    const rawMetode = student.metodePembayaran || student.metode_pembayaran || student.tipe_pembayaran || "";
    const detectedScheme = normalizePaymentScheme(rawMetode, rawProg);
    const preset = buildInvoiceProgramPreset(rawProg, detectedScheme, student.totalBiaya || student.total_biaya || 0);

    setProgramInfo(prev => ({
      ...prev,
      program: preset.program,
      durasi: preset.durasi,
    }));
    setSkemaPembayaran(detectedScheme);
    setItems([
      {
        id: 1,
        deskripsi: preset.deskripsi,
        subdeskripsi: preset.subdeskripsi,
        harga: preset.harga,
        diskon: 0,
        jumlah: preset.harga,
      }
    ]);
  };

  useEffect(() => {
    if (!isManualStudent && selectedStudent) {
      applyStudentToInvoice(selectedStudent);
    }
  }, [
    isManualStudent,
    selectedStudent?.id,
    selectedStudent?.program,
    selectedStudent?.metodePembayaran,
    selectedStudent?.totalBiaya,
  ]);

  const handleProgramSelectChange = (newProgram) => {
    const preset = buildInvoiceProgramPreset(newProgram, skemaPembayaran, 0);
    setProgramInfo(prev => ({ ...prev, program: newProgram, durasi: preset.durasi }));
    setItems(prev => {
      if (prev.length === 0) {
        return [{ id: 1, deskripsi: preset.deskripsi, subdeskripsi: preset.subdeskripsi, harga: preset.harga, diskon: 0, jumlah: preset.harga }];
      }
      return prev.map((it, idx) => idx === 0 ? {
        ...it,
        deskripsi: preset.deskripsi,
        subdeskripsi: preset.subdeskripsi,
        harga: preset.harga,
        jumlah: preset.harga,
      } : it);
    });
  };

  const handleSchemeChange = (nextScheme) => {
    setSkemaPembayaran(nextScheme);
    const preset = buildInvoiceProgramPreset(programInfo.program, nextScheme, 0);
    setItems(prev => prev.map((it, idx) => {
      if (idx !== 0) return it;
      const curHarga = Number(it.harga || 0);
      const isPresetPrice = [0, 5000000, 7500000, 15000000, 17760000, 18000000, 25000000].includes(curHarga);
      const nextHarga = isPresetPrice ? preset.harga : curHarga;
      return {
        ...it,
        deskripsi: preset.deskripsi,
        subdeskripsi: preset.subdeskripsi,
        harga: nextHarga,
        jumlah: nextHarga,
      };
    }));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: value };
      const p = field === "harga" ? (Number(value) || 0) : (Number(it.harga) || 0);
      updated.jumlah = p;
      return updated;
    }));
  };

  const handleAddItem = () => {
    const nextId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    setItems([
      ...items,
      {
        id: nextId,
        deskripsi: "Biaya Pelatihan & Modul Tambahan",
        subdeskripsi: "Materi pendukung sertifikasi dan ujian",
        harga: 2000000,
        diskon: 0,
        jumlah: 2000000,
      }
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) return;
    setItems(items.filter(it => it.id !== id));
  };

  const handleApplyTemplate = () => {
    const preset = buildInvoiceProgramPreset(programInfo.program, skemaPembayaran, 0);
    setItems([
      {
        id: 1,
        deskripsi: preset.deskripsi,
        subdeskripsi: preset.subdeskripsi,
        harga: preset.harga,
        diskon: 0,
        jumlah: preset.harga,
      }
    ]);
    setProgramInfo(prev => ({
      ...prev,
      program: preset.program,
      durasi: preset.durasi,
    }));
    Swal.fire({
      icon: "success",
      title: "Template Diterapkan",
      text: `Program ${preset.deskripsi} telah diatur.`,
      timer: 1500,
      showConfirmButton: false,
      customClass: { popup: "rounded-2xl" }
    });
  };

  const subtotal = items.reduce((acc, it) => acc + (Number(it.jumlah) || 0), 0);
  const totalDiskon = items.reduce((acc, it) => acc + (Number(it.diskon) || 0), 0);
  const totalTagihan = Math.max(0, subtotal - totalDiskon);

  const [pembayaranList, setPembayaranList] = useState([
    { id: 1, deskripsi: "Full Payment", jatuhTempo: "2026-08-23", nominal: 15000000 }
  ]);

  // Keep payments in sync when switching between Full and Cicilan
  useEffect(() => {
    if (skemaPembayaran === "full") {
      setPembayaranList([
        { id: 1, deskripsi: "Full Payment", jatuhTempo: jatuhTempo, nominal: totalTagihan }
      ]);
    } else if (totalTagihan === 18000000) {
      const amounts = [5000000, 4000000, 3000000, 2000000, 2000000, 2000000];
      const baseDate = new Date(jatuhTempo || Date.now());
      setPembayaranList(
        amounts.map((amt, i) => {
          const d = new Date(baseDate);
          d.setMonth(d.getMonth() + i);
          return {
            id: i + 1,
            deskripsi: i === 0 ? "Cicilan 1 (DP)" : i === amounts.length - 1 ? `Cicilan ${i + 1} (Pelunasan)` : `Cicilan ${i + 1}`,
            jatuhTempo: d.toISOString().split("T")[0],
            nominal: amt,
          };
        })
      );
    } else {
      const dp = Math.round(totalTagihan * 0.4);
      const sisa = totalTagihan - dp;
      const c1 = Math.round(sisa / 2);
      const c2 = sisa - c1;

      const d1 = new Date(jatuhTempo || Date.now());
      const d2 = new Date(d1); d2.setMonth(d2.getMonth() + 1);
      const d3 = new Date(d1); d3.setMonth(d3.getMonth() + 2);

      setPembayaranList([
        { id: 1, deskripsi: "Cicilan 1 (DP)", jatuhTempo: d1.toISOString().split("T")[0], nominal: dp },
        { id: 2, deskripsi: "Cicilan 2", jatuhTempo: d2.toISOString().split("T")[0], nominal: c1 },
        { id: 3, deskripsi: "Cicilan 3 (Pelunasan)", jatuhTempo: d3.toISOString().split("T")[0], nominal: c2 }
      ]);
    }
  }, [skemaPembayaran, totalTagihan, jatuhTempo]);

  const handlePembayaranChange = (id, field, value) => {
    setPembayaranList(pembayaranList.map(p => {
      if (p.id !== id) return p;
      return { ...p, [field]: field === "nominal" ? (Number(value) || 0) : value };
    }));
  };

  const handleAddPembayaran = () => {
    const nextId = pembayaranList.length > 0 ? Math.max(...pembayaranList.map(p => p.id)) + 1 : 1;
    const lastDate = pembayaranList[pembayaranList.length - 1]?.jatuhTempo || jatuhTempo;
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + 1);

    setPembayaranList([
      ...pembayaranList,
      {
        id: nextId,
        deskripsi: `Cicilan ${nextId}`,
        jatuhTempo: nextDate.toISOString().split("T")[0],
        nominal: 0
      }
    ]);
  };

  const handleRemovePembayaran = (id) => {
    if (pembayaranList.length <= 1) return;
    setPembayaranList(pembayaranList.filter(p => p.id !== id));
  };

  // ─── 5. REKENING TUJUAN & COA AKUN (SYNC DENGAN CHART OF ACCOUNTS) ──────────
  const [bankAccounts, setBankAccounts] = useState(() => getStoredBankAccounts());
  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    const list = getStoredBankAccounts();
    const bca = list.find(a => a.bank === "BCA" || a.kode === "1002" || String(a.noRek || '').includes("1832-918-428"));
    return bca?.id || list[0]?.id || "coa-1002";
  });

  const selectedAccount = useMemo(() => {
    return bankAccounts.find(b => b.id === selectedAccountId) || bankAccounts[0] || {
      id: "coa-1002",
      kode: "1002",
      nama: "Bank BCA Operasional",
      bank: "BCA",
      noRek: "1832-918-428",
      pemilik: "PT LPK Creativa",
      saldo: 145200000
    };
  }, [bankAccounts, selectedAccountId]);

  const rekeningTujuan = `${selectedAccount.bank} - ${selectedAccount.nama} (${selectedAccount.noRek})`;
  const [catatanOpsional, setCatatanOpsional] = useState("");

  // ─── SUBMIT HANDLERS ────────────────────────────────────────────────────────
  const handleTerbitkanInvoice = async () => {
    if (!activeStudent?.nama || activeStudent.nama === "Belum Ada Siswa Terpilih") {
      Swal.fire({
        icon: "warning",
        title: "Pilih Siswa Terlebih Dahulu",
        text: "Silakan pilih data siswa aktif sebelum menerbitkan invoice.",
        customClass: { popup: "rounded-2xl" }
      });
      return;
    }

    setBusy(true);
    try {
      const invoicePayload = {
        action: "add_invoice",
        id: invoiceNumber,
        tanggal: tanggalInvoice,
        jatuhTempo: jatuhTempo,
        customer: activeStudent.nama,
        email: activeStudent.email,
        phone: activeStudent.phone,
        total: totalTagihan,
        keterangan: `${programInfo.program} (${skemaPembayaran === "full" ? "Full Payment" : "Cicilan / Installment"})`,
        status: "Unpaid",
        skema: skemaPembayaran,
        program: programInfo.program,
        lokasi: programInfo.lokasi,
        durasi: programInfo.durasi,
        salesCode: salesCode,
        items: items,
        installments: pembayaranList,
        includes: DEFAULT_INCLUSIONS_LIST,
        excludes: DEFAULT_EXCLUSIONS_LIST,
        notes: catatanOpsional,
        rekening: rekeningTujuan,
        coa_code: selectedAccount.kode,
        bank_name: selectedAccount.bank,
        account_number: selectedAccount.noRek,
        account_holder: selectedAccount.pemilik,
      };

      // 1. Post to API
      try {
        await axios.post("/api/billing.php", invoicePayload);
      } catch (err) {
        console.warn("Backend billing endpoint fallback, saving to local storage", err);
      }

      // 2. Persist to local storage
      const saved = JSON.parse(localStorage.getItem("saved_custom_invoices") || "[]");
      saved.unshift(invoicePayload);
      localStorage.setItem("saved_custom_invoices", JSON.stringify(saved));

      // Auto-sync ke saved_custom_terkirim (Invoice Terkirim)
      try {
        const savedTerkirim = JSON.parse(localStorage.getItem("saved_custom_terkirim") || "[]");
        const chosenKanal = activeStudent.phone && activeStudent.phone !== "-" ? "WhatsApp" : "Email";
        const recipient = chosenKanal === "WhatsApp" ? activeStudent.phone : (activeStudent.email || "-");
        savedTerkirim.unshift({
          id: invoiceNumber,
          noInv: invoiceNumber,
          customer: activeStudent.nama,
          tglKirim: tanggalInvoice,
          kanal: chosenKanal,
          penerima: recipient,
          statusKirim: "Terkirim",
          statusBaca: "Dibaca",
          nominal: totalTagihan,
          terbayar: 0,
          sisa: totalTagihan,
          statusInvoice: "Unpaid",
          program: programInfo.program || "Kelas Reguler"
        });
        localStorage.setItem("saved_custom_terkirim", JSON.stringify(savedTerkirim));
      } catch (errSync) {
        console.warn("Gagal auto-sync saved_custom_terkirim:", errSync);
      }

      // Auto-sync ke local_only_students_finance (Master Siswa Finance)
      try {
        const savedStudents = JSON.parse(localStorage.getItem("local_only_students_finance") || "[]");
        const stdIdx = savedStudents.findIndex(s => (s.nama || s.name || "").trim().toLowerCase() === (activeStudent.nama || "").trim().toLowerCase());
        if (stdIdx >= 0) {
          savedStudents[stdIdx] = {
            ...savedStudents[stdIdx],
            jmlInv: (savedStudents[stdIdx].jmlInv || 0) + 1,
            total: (Number(savedStudents[stdIdx].total) || 0) + totalTagihan,
            sisa: (Number(savedStudents[stdIdx].sisa) || 0) + totalTagihan,
            status: "Prioritas"
          };
        } else if (activeStudent.nama) {
          savedStudents.unshift({
            id: `SIS-${Date.now().toString().slice(-4)}`,
            nama: activeStudent.nama,
            pic: "Siswa Mandiri",
            telp: activeStudent.phone || "0812-7788-9900",
            email: activeStudent.email || `${activeStudent.nama.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
            status: "Prioritas",
            program: programInfo.program || "Kelas Reguler",
            jmlInv: 1,
            total: totalTagihan,
            terbayar: 0,
            sisa: totalTagihan
          });
        }
        localStorage.setItem("local_only_students_finance", JSON.stringify(savedStudents));
      } catch (errSyncStd) {
        console.warn("Gagal auto-sync local_only_students_finance:", errSyncStd);
      }

      // 3. Success notification
      await Swal.fire({
        icon: "success",
        title: "Invoice Berhasil Diterbitkan!",
        html: `Nomor Invoice <b>${invoiceNumber}</b> untuk <b>${activeStudent.nama}</b> telah diterbitkan dan tersimpan di sistem.`,
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
        text: error?.message || "Terjadi kesalahan saat menyimpan data.",
        customClass: { popup: "rounded-2xl" }
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDraft = () => {
    const draftPayload = {
      id: invoiceNumber,
      tanggal: tanggalInvoice,
      jatuhTempo: jatuhTempo,
      customer: activeStudent.nama,
      email: activeStudent.email,
      phone: activeStudent.phone,
      total: totalTagihan,
      status: "Draft",
      program: programInfo.program,
      salesCode: salesCode,
      items: items,
      installments: pembayaranList,
      notes: catatanOpsional,
      isDraft: true
    };

    const saved = JSON.parse(localStorage.getItem("saved_custom_invoices") || "[]");
    saved.unshift(draftPayload);
    localStorage.setItem("saved_custom_invoices", JSON.stringify(saved));

    Swal.fire({
      icon: "success",
      title: "Draft Tersimpan!",
      html: `Invoice <b>${invoiceNumber}</b> tersimpan sebagai draft dan dapat disunting kembali kapan saja.`,
      timer: 2000,
      showConfirmButton: false,
      customClass: { popup: "rounded-2xl" }
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  const handleDownloadPDF = () => {
    const accountHolderName =
      String(selectedAccount.noRek || "").includes("1832-918-428") &&
      String(selectedAccount.pemilik || "").trim().toUpperCase() === "PT LPK CREATIVA"
        ? "CREATIVA BRIDGING INTERN"
        : (selectedAccount.pemilik || "CREATIVA BRIDGING INTERN");

    generateInvoicePDF({
      id: invoiceNumber,
      tanggal: tanggalInvoice,
      jatuhTempo: jatuhTempo,
      customer: activeStudent.nama,
      program: programInfo.program,
      lokasi: programInfo.lokasi,
      durasi: programInfo.durasi,
      skema: skemaPembayaran,
      subtotal: subtotal,
      discount: totalDiskon > 0 ? { desc: "Diskon", amount: totalDiskon } : undefined,
      total: totalTagihan,
      terbayar: 0,
      sisa: totalTagihan,
      status: "Unpaid",
      items: items.map(it => ({
        deskripsi: it.deskripsi,
        subdeskripsi: it.subdeskripsi,
        qty: 1,
        harga: Number(it.harga) || 0,
        price: Number(it.harga) || 0,
        diskon: Number(it.diskon) || 0,
        jumlah: Number(it.jumlah ?? it.harga) || 0,
        amount: Math.max(0, (Number(it.jumlah ?? it.harga) || 0) - (Number(it.diskon) || 0)),
      })),
      installments: pembayaranList,
      includes: DEFAULT_INCLUSIONS_LIST,
      excludes: DEFAULT_EXCLUSIONS_LIST,
      email: activeStudent.email,
      phone: activeStudent.phone,
      alamat: activeStudent.alamat,
      rekening: rekeningTujuan,
      bank_name: selectedAccount.bank || "BCA",
      account_number: selectedAccount.noRek || "1832-918-428",
      account_holder: accountHolderName,
      notes: catatanOpsional,
    });
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
              onClick={() => setShowPreviewModal(true)}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-2 shadow-2xs"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              Preview Invoice
            </button>
            <button
              onClick={handleTerbitkanInvoice}
              disabled={busy}
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
                        onChange={e => setInvoiceNumber(e.target.value)}
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
                        onChange={e => setTanggalInvoice(e.target.value)}
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
                        onChange={e => setJatuhTempo(e.target.value)}
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
                      disabled={isSyncingPeserta}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                      title="Tarik data pendaftar terbaru dari creativabridging.com"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPeserta ? "animate-spin" : ""}`} />
                      {isSyncingPeserta ? "Menarik Data..." : "Tarik Siswa dari Web Pendaftaran"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsManualStudent(!isManualStudent)}
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
                          value={selectedStudent?.nis || selectedStudent?.id || ""}
                          onChange={e => {
                            const val = e.target.value;
                            const found = liveStudents.find(s => (s.nis || s.id) === val || s.nama === val);
                            if (found) setSelectedStudent(found);
                          }}
                          disabled={liveStudents.length === 0}
                          className="w-full bg-white border border-slate-300 hover:border-blue-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer appearance-none pr-10 transition disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          {liveStudents.length === 0 ? (
                            <option value="">Belum ada siswa terdaftar di Modul Students</option>
                          ) : (
                            liveStudents.map((s, idx) => (
                              <option key={s.id || s.nis || idx} value={s.nis || s.id || s.nama}>
                                {s.nama} ({s.nis || "S-001"})
                              </option>
                            ))
                          )}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <Search className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    {/* Selected Student Information (Bootstrap / Laravel Classic Table Style) */}
                    {activeStudent && (
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
                                  {activeStudent.metodePembayaran || (skemaPembayaran === "cicilan" ? "Cicilan" : "Full Payment")}
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
                      <select
                        value={manualStudent.program}
                        onChange={e => {
                          const nextProgram = e.target.value;
                          setManualStudent(prev => ({ ...prev, program: nextProgram }));
                          handleProgramSelectChange(nextProgram);
                        }}
                        className="w-full p-2 bg-white rounded-lg border border-slate-200 font-semibold"
                      >
                        <option value="Intensif Offline">Intensif Offline</option>
                        <option value="Kaigo Dana Talang">Kaigo Dana Talang</option>
                        <option value="Matching Job">Matching Job</option>
                        <option value="Sotsugyousei">Sotsugyousei</option>
                        <option value="Kursus Reguler">Kursus Reguler</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Metode Pembayaran</label>
                      <select
                        value={manualStudent.metodePembayaran || "Full Payment"}
                        onChange={e => {
                          const nextPay = e.target.value;
                          setManualStudent(prev => ({ ...prev, metodePembayaran: nextPay }));
                          handleSchemeChange(nextPay.toLowerCase().includes("cicil") ? "cicilan" : "full");
                        }}
                        className="w-full p-2 bg-white rounded-lg border border-slate-200 font-semibold"
                      >
                        <option value="Full Payment">Full Payment</option>
                        <option value="Cicilan">Cicilan</option>
                      </select>
                    </div>
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
                  {(activeStudent?.fromWeb || activeStudent?.metodePembayaran) && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Tersinkron dari Pendaftaran Web
                    </span>
                  )}
                </div>

                {/* 3 Program Selectors Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pilih Program *</label>
                    <select
                      value={programInfo.program}
                      onChange={e => handleProgramSelectChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="Intensif Offline">Intensif Offline</option>
                      <option value="Kaigo Dana Talang">Kaigo Dana Talang</option>
                      <option value="Kelas Intensif Offline (Full Payment)">Kelas Intensif Offline (Full Payment)</option>
                      <option value="Kelas Intensif Offline">Kelas Intensif Offline</option>
                      <option value="Program Pelatihan Jepang">Program Pelatihan Jepang</option>
                      <option value="Program SSW Kaigo">Program SSW Kaigo</option>
                      <option value="Matching Job">Matching Job</option>
                      <option value="Sotsugyousei">Sotsugyousei</option>
                      <option value="Kursus Reguler">Kursus Reguler</option>
                      {![
                        "Intensif Offline",
                        "Kaigo Dana Talang",
                        "Kelas Intensif Offline (Full Payment)",
                        "Kelas Intensif Offline",
                        "Program Pelatihan Jepang",
                        "Program SSW Kaigo",
                        "Matching Job",
                        "Sotsugyousei",
                        "Kursus Reguler",
                      ].includes(programInfo.program) && programInfo.program && (
                          <option value={programInfo.program}>{programInfo.program}</option>
                        )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Lokasi</label>
                    <select
                      value={programInfo.lokasi}
                      onChange={e => setProgramInfo({ ...programInfo, lokasi: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option>Cianjur</option>
                      <option>Bandung</option>
                      <option>Jakarta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Durasi</label>
                    <select
                      value={programInfo.durasi}
                      onChange={e => setProgramInfo({ ...programInfo, durasi: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option>7 Bulan</option>
                      <option>6 Bulan</option>
                      <option>4 Bulan</option>
                      <option>1 Tahun</option>
                    </select>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3">Item / Deskripsi</th>
                        <th className="py-2.5 px-3 w-32 text-right">Harga (Rp)</th>
                        <th className="py-2.5 px-3 w-28 text-right">Diskon (Rp)</th>
                        <th className="py-2.5 px-3 w-32 text-right">Jumlah (Rp)</th>
                        <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {items.map((it, idx) => (
                        <tr key={it.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={it.deskripsi}
                              onChange={e => handleItemChange(it.id, "deskripsi", e.target.value)}
                              className="w-full font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-blue-400 outline-none pb-0.5 text-xs"
                            />
                            <input
                              type="text"
                              value={it.subdeskripsi}
                              onChange={e => handleItemChange(it.id, "subdeskripsi", e.target.value)}
                              className="w-full text-[11px] text-slate-400 bg-transparent border-b border-transparent focus:border-blue-400 outline-none mt-0.5"
                            />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <input
                              type="number"
                              step="500000"
                              value={it.harga}
                              onChange={e => handleItemChange(it.id, "harga", e.target.value)}
                              className="w-26 px-2 py-1 text-right font-bold text-slate-800 border border-slate-200 rounded-lg text-xs font-mono"
                            />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <input
                              type="number"
                              step="50000"
                              value={it.diskon}
                              onChange={e => handleItemChange(it.id, "diskon", e.target.value)}
                              className="w-22 px-2 py-1 text-right font-semibold text-slate-600 border border-slate-200 rounded-lg text-xs font-mono"
                            />
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                            {formatRp(it.jumlah - (Number(it.diskon) || 0))}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleRemoveItem(it.id)}
                              disabled={items.length === 1}
                              title="Hapus Baris"
                              className="text-slate-300 hover:text-rose-500 disabled:opacity-20 transition p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition pt-1"
                >
                  <Plus className="w-4 h-4" /> Tambah Item
                </button>
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
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Metode Pembayaran *</label>
                      <select
                        value={metodePembayaran}
                        onChange={e => setMetodePembayaran(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option>Transfer Bank</option>
                        <option>Cash / Tunai</option>
                        <option>Virtual Account</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Skema Pembayaran *</label>
                      <div className="flex items-center gap-4">
                        <label className={`flex items-center gap-2 cursor-pointer ${skemaPembayaran === "full" ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                          <input
                            type="radio"
                            name="skema"
                            value="full"
                            checked={skemaPembayaran === "full"}
                            onChange={() => handleSchemeChange("full")}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>Full Payment</span>
                        </label>
                        <label className={`flex items-center gap-2 cursor-pointer ${skemaPembayaran === "cicilan" ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                          <input
                            type="radio"
                            name="skema"
                            value="cicilan"
                            checked={skemaPembayaran === "cicilan"}
                            onChange={() => handleSchemeChange("cicilan")}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>Cicilan (Installment)</span>
                        </label>
                      </div>
                    </div>

                    {/* Rincian Pembayaran Table */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <h4 className="font-bold text-slate-800 text-xs">Rincian Pembayaran</h4>
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-2 text-center w-8">No</th>
                              <th className="py-2 px-2">Deskripsi</th>
                              <th className="py-2 px-2 w-28">Jatuh Tempo</th>
                              <th className="py-2 px-2 text-right w-28">Nominal (Rp)</th>
                              <th className="py-2 px-2 text-center w-8">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {pembayaranList.map((p, idx) => (
                              <tr key={p.id}>
                                <td className="py-2 px-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    value={p.deskripsi}
                                    onChange={e => handlePembayaranChange(p.id, "deskripsi", e.target.value)}
                                    className="w-full font-bold text-slate-800 bg-transparent outline-none"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="date"
                                    value={p.jatuhTempo}
                                    onChange={e => handlePembayaranChange(p.id, "jatuhTempo", e.target.value)}
                                    className="w-full text-slate-700 bg-transparent outline-none text-[11px]"
                                  />
                                </td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                                  <input
                                    type="number"
                                    step="100000"
                                    value={p.nominal}
                                    onChange={e => handlePembayaranChange(p.id, "nominal", e.target.value)}
                                    className="w-24 text-right font-mono font-bold text-slate-900 bg-transparent outline-none"
                                  />
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <button
                                    onClick={() => handleRemovePembayaran(p.id)}
                                    disabled={pembayaranList.length === 1}
                                    className="text-slate-300 hover:text-rose-500 disabled:opacity-20"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddPembayaran}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Pembayaran
                      </button>
                    </div>
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
                        value={selectedAccountId}
                        onChange={e => setSelectedAccountId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {bankAccounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
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
              onClick={() => setShowPreviewModal(true)}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-2 shadow-2xs"
            >
              <Eye className="w-4 h-4 text-slate-500" />
              Preview Invoice
            </button>
            <button
              onClick={handleTerbitkanInvoice}
              disabled={busy}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-blue-500/25 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Terbitkan Invoice
            </button>
          </div>

        </div>

        {/* ── MODAL PREVIEW INVOICE DOKUMEN (POPUP DIALOG) ───────────────────── */}
        {showPreviewModal && (
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
                            <td className="text-slate-800 py-0.5">: {formatRpComma(totalTagihan)}</td>
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
                          {formatRpNoDecimals(it.harga)}
                        </div>
                        <div className="col-span-3 text-right font-bold text-black text-[13px]">
                          {formatRpNoDecimals(Math.max(0, (Number(it.jumlah ?? it.harga) || 0) - (Number(it.diskon) || 0)))}
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
                        <span className="text-black">{formatRpComma(subtotal)}</span>
                      </div>
                      {totalDiskon > 0 && (
                        <div className="flex justify-between py-1.5 border-b border-slate-400">
                          <span className="font-bold text-black">Discount:</span>
                          <span className="text-black">- {formatRpComma(totalDiskon)}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1.5 border-b border-slate-500">
                        <span className="font-bold text-black">Total:</span>
                        <span className="text-black">{formatRpComma(totalTagihan)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 font-bold text-black">
                        <span>Amount Due (IDR):</span>
                        <span>{formatRpComma(totalTagihan, true)}</span>
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
                        {(pembayaranList && pembayaranList.length > 0
                          ? pembayaranList
                          : [{ id: 1, deskripsi: "FULL PAYMENT", jatuhTempo: jatuhTempo, nominal: totalTagihan }]
                        ).map((inst, idx) => (
                          <tr key={inst.id || idx}>
                            <td className="border border-slate-300 px-3 py-2 uppercase">
                              {inst.deskripsi || (pembayaranList.length === 1 ? "FULL PAYMENT" : `CICILAN KE-${idx + 1}`)}
                            </td>
                            <td className="border border-slate-300 px-3 py-2">
                              {formatInvoiceDateUpper(inst.jatuhTempo)}
                            </td>
                            <td className="border border-slate-300 px-3 py-2 text-right">
                              {formatRpComma(inst.nominal)}
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
                            Bank {selectedAccount.bank || "BCA"} No. Rekening {selectedAccount.noRek || "1832-918-428"} atas nama{" "}
                            {String(selectedAccount.noRek || "").includes("1832-918-428") &&
                            String(selectedAccount.pemilik || "").trim().toUpperCase() === "PT LPK CREATIVA"
                              ? "CREATIVA BRIDGING INTERN"
                              : (selectedAccount.pemilik || "CREATIVA BRIDGING INTERN")}
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
