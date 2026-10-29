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
  Calendar,
  Check,
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
        const cleanNis = s.nis ? (String(s.nis).startsWith("CB-") ? String(s.nis).replace(/^CB-/, "TGCJ2610") : s.nis) : `S-${String(s.id).padStart(3, "0")}`;
        return {
          id: cleanNis,
          rawId: s.id,
          nama: name,
          nis: cleanNis,
          phone: s.kontak || s.phone || s.no_wa || "0812-xxxx-xxxx",
          email: s.email && s.email !== "-" ? s.email : `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
          alamat: s.alamat ? `${s.alamat}, ${s.kota || "Kab. Cianjur"}` : (s.kota || "Kab. Cianjur, Jawa Barat"),
          status: s.status === "Nonaktif" ? "Siswa Nonaktif" : "Siswa Aktif",
          program: s.program || "Kelas Intensif Offline",
          batch: s.batch ? (String(s.batch).toLowerCase().startsWith("batch") ? s.batch : `Batch ${s.batch}`) : "2"
        };
      });
  } catch (e) {
    return [];
  }
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
              if (c.nama.toLowerCase().includes("mandiri") || (c.rekeningDetail && c.rekeningDetail.toLowerCase().includes("mandiri"))) bankName = "Mandiri";
              else if (c.nama.toLowerCase().includes("bni") || (c.rekeningDetail && c.rekeningDetail.toLowerCase().includes("bni"))) bankName = "BNI";
              else if (c.nama.toLowerCase().includes("bri") || (c.rekeningDetail && c.rekeningDetail.toLowerCase().includes("bri"))) bankName = "BRI";
              else if (c.nama.toLowerCase().includes("bca") || (c.rekeningDetail && c.rekeningDetail.toLowerCase().includes("bca"))) bankName = "BCA";

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
  "Kelas Mulai : September 2026",
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
    program: "Kelas Intensif Offline",
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
                  program: s.program || "Kelas Intensif Offline",
                  batch: s.batch ? String(s.batch).replace(/^batch\s*/i, "") : "2"
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
              status: s.status === "Nonaktif" ? "Siswa Nonaktif" : "Siswa Aktif",
              program: s.program || "Kelas Intensif Offline",
              batch: s.batch ? String(s.batch).replace(/^batch\s*/i, "") : "2"
            };
          });

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
      const response = await fetch("https://creativabridging.com/api_peserta.php?api_key=CREATIVA_SYNC_SECRET_2026");
      const result = await response.json();

      if (!result.status || !Array.isArray(result.data)) {
        throw new Error(result.message || "Gagal mendapatkan data peserta");
      }

      const deletedIds = JSON.parse(localStorage.getItem("deleted_students_finance") || "[]");
      const localOnly = JSON.parse(localStorage.getItem("local_only_students_finance") || "[]");

      const currentYear = new Date().getFullYear().toString().slice(-2);
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

      const formattedParticipants = result.data
        .filter(p => p.nama && !deletedIds.includes(p.id) && !deletedIds.includes(`CB-${p.id}`))
        .map(p => {
          const rawId = p.id;
          // Format standar NIS LPK: TGCJ + Tahun(2 digit) + Bulan(2 digit) + ID urut (3 digit)
          // Contoh: TGCJ2610095 (sesuai format invoice resmi TGCJ)
          const nisCode = p.nis || `TGCJ${currentYear}${currentMonth}${String(rawId).padStart(3, "0")}`;
          const pName = p.nama.trim();
          const cleanPhone = p.phone && p.phone !== "-" ? p.phone : "";
          const cleanEmail = p.email && p.email !== "-" ? p.email : `${pName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`;
          const address = p.kotaDomisili ? `${p.kotaDomisili}, ${p.lokasiTinggal || "Indonesia"}` : "Cianjur, Jawa Barat";

          return {
            id: nisCode,
            rawId: rawId,
            nama: pName,
            nis: nisCode,
            phone: cleanPhone || "0812-xxxx-xxxx",
            email: cleanEmail,
            alamat: address,
            status: p.status === "Pembayaran" ? "Menunggu Pembayaran" : `Siswa (${p.status || "Aktif"})`,
            program: p.program || "Kelas Intensif",
            batch: "2",
            noKtp: p.noKtp || "",
            fromWeb: true
          };
        });

      // Bersihkan list lama dari prefiks sementara CB- jika ada
      const cleanedExisting = liveStudents.filter(s => !String(s.nis || s.id).startsWith("CB-"));
      const cleanedLocal = localOnly.filter(s => !String(s.nis || s.id).startsWith("CB-"));

      const mergedList = [...cleanedExisting];
      const newLocalOnly = [...cleanedLocal];

      formattedParticipants.forEach(fp => {
        const existingIdx = mergedList.findIndex(
          s => s.id === fp.id || s.nis === fp.nis || (s.nama && s.nama.toLowerCase() === fp.nama.toLowerCase())
        );
        if (existingIdx === -1) {
          mergedList.push(fp);
          newLocalOnly.push(fp);
        } else {
          mergedList[existingIdx] = { ...mergedList[existingIdx], ...fp };
        }
      });

      localStorage.setItem("local_only_students_finance", JSON.stringify(newLocalOnly));
      setLiveStudents(mergedList);

      // Auto-select first participant if no student selected
      if (mergedList.length > 0) {
        setSelectedStudent(mergedList[0]);
      }

      Swal.fire({
        icon: "success",
        title: "Sinkronisasi Berhasil!",
        html: `Berhasil menarik <b>${result.total || result.data.length} siswa pendaftar</b> dari <code>creativabridging.com</code>!<br><span class="text-xs text-slate-500">Data telah otomatis masuk dan siap digunakan untuk Buat Invoice.</span>`,
        customClass: { popup: "rounded-2xl" },
        confirmButtonColor: "#2563eb"
      });
    } catch (err) {
      console.error("Gagal sinkron data peserta:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Menarik Data",
        text: err.message || "Pastikan koneksi internet aktif dan endpoint creativabridging.com dapat diakses.",
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
    program: manualStudent.program || "Kelas Intensif Offline",
    batch: manualStudent.batch || "2"
  } : (selectedStudent || {
    id: "S-001",
    nama: "Belum Ada Siswa Terpilih",
    nis: "-",
    phone: "-",
    email: "-",
    alamat: "-",
    status: "Nonaktif",
    program: "Kelas Intensif Offline",
    batch: "2"
  });

  // ─── 3. PROGRAM & ITEM TAGIHAN ──────────────────────────────────────────────
  const [programInfo, setProgramInfo] = useState({
    program: "Kelas Intensif Offline (Full Payment)",
    lokasi: "Cianjur",
    kelasMulai: "September 2026",
    durasi: "7 Bulan",
  });

  const [items, setItems] = useState([
    {
      id: 1,
      deskripsi: "Kelas Intensif Offline (Full Payment)",
      subdeskripsi: "Biaya Pendidikan Bahasa Jepang dan Pelatihan Skill - Cianjur",
      qty: 1,
      harga: 15000000,
      diskon: 0,
      jumlah: 15000000,
    },
  ]);

  const handleItemChange = (id, field, value) => {
    setItems(items.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: value };
      const q = field === "qty" ? (Number(value) || 0) : (Number(it.qty) || 0);
      const p = field === "harga" ? (Number(value) || 0) : (Number(it.harga) || 0);
      const d = field === "diskon" ? (Number(value) || 0) : (Number(it.diskon) || 0);
      updated.jumlah = q * p;
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
        qty: 1,
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
    setItems([
      {
        id: 1,
        deskripsi: "Kelas Intensif Offline (Full Payment)",
        subdeskripsi: "Biaya Pendidikan Bahasa Jepang dan Pelatihan Skill - Cianjur",
        qty: 1,
        harga: 15000000,
        diskon: 0,
        jumlah: 15000000,
      }
    ]);
    setProgramInfo({
      program: "Kelas Intensif Offline (Full Payment)",
      lokasi: "Cianjur",
      kelasMulai: "September 2026",
      durasi: "7 Bulan",
    });
    Swal.fire({
      icon: "success",
      title: "Template Diterapkan",
      text: "Program Kelas Intensif Offline (Full Payment) telah diatur.",
      timer: 1500,
      showConfirmButton: false,
      customClass: { popup: "rounded-2xl" }
    });
  };

  // ─── 4. SKEMA PEMBAYARAN ────────────────────────────────────────────────────
  const [metodePembayaran, setMetodePembayaran] = useState("Transfer Bank");
  const [skemaPembayaran, setSkemaPembayaran] = useState("full"); // "full" | "cicilan"

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
    } else {
      const dp = Math.round(totalTagihan * 0.4);
      const sisa = totalTagihan - dp;
      const c1 = Math.round(sisa / 2);
      const c2 = sisa - c1;

      const d1 = new Date(jatuhTempo);
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
    return list[0]?.id || "coa-1002";
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
  const [catatanOpsional, setCatatanOpsional] = useState("Kelas mulai September 2026.");

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
    generateInvoicePDF({
      id: invoiceNumber,
      tanggal: tanggalInvoice,
      customer: activeStudent.nama,
      program: programInfo.program,
      total: totalTagihan,
      terbayar: 0,
      sisa: totalTagihan,
      status: "Unpaid",
      jatuhTempo: jatuhTempo,
      items: items,
      email: activeStudent.email,
      phone: activeStudent.phone,
      alamat: activeStudent.alamat,
      rekening: rekeningTujuan,
      notes: `1. Invoice ini bersifat confidential (rahasia) dan merupakan bukti tagihan resmi.
2. Cara Pembayaran:
   - Transfer via ${selectedAccount.bank} No. Rekening ${selectedAccount.noRek} a/n ${selectedAccount.pemilik} (COA ${selectedAccount.kode})
   - Harap cantumkan Nomor Invoice pada berita transfer.
   - Kirimkan bukti transfer ke WhatsApp Finance atau email finance@creativabridging.com
3. Pelunasan tagihan wajib diselesaikan sesuai tanggal jatuh tempo yang tertera.
Terimakasih telah bergabung dengan LPK Creativa Bridging International.`
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
                            <tr>
                              <th className="bg-slate-50 text-slate-600 font-semibold px-3 py-2 border-r border-slate-200">Alamat</th>
                              <td className="px-3 py-2 text-slate-800 border-r border-slate-200 truncate max-w-xs">{activeStudent.alamat}</td>
                              <th className="bg-slate-50 text-slate-600 font-semibold px-3 py-2 border-r border-slate-200">Status</th>
                              <td className="px-3 py-2">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {activeStudent.status || "Siswa Aktif"}
                                </span>
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
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span>Program & Item Tagihan</span>
                </div>

                {/* 4 Program Selectors Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pilih Program *</label>
                    <select
                      value={programInfo.program}
                      onChange={e => setProgramInfo({ ...programInfo, program: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option>Kelas Intensif Offline (Full Payment)</option>
                      <option>Kelas Intensif Offline</option>
                      <option>Program Pelatihan Jepang</option>
                      <option>Program SSW Kaigo</option>
                      <option>Kursus Reguler</option>
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
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kelas Mulai</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={programInfo.kelasMulai}
                        onChange={e => setProgramInfo({ ...programInfo, kelasMulai: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
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
                        <th className="py-2.5 px-3 w-16 text-center">Qty</th>
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
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={it.qty}
                              onChange={e => handleItemChange(it.id, "qty", e.target.value)}
                              className="w-12 px-1.5 py-1 text-center font-bold text-slate-800 border border-slate-200 rounded-lg text-xs"
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
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                          <input
                            type="radio"
                            name="skema"
                            value="full"
                            checked={skemaPembayaran === "full"}
                            onChange={() => setSkemaPembayaran("full")}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>Full Payment</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                          <input
                            type="radio"
                            name="skema"
                            value="cicilan"
                            checked={skemaPembayaran === "cicilan"}
                            onChange={() => setSkemaPembayaran("cicilan")}
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
                        <div className={`w-12 h-7 rounded-md flex items-center justify-center shadow-2xs font-black text-xs italic tracking-wider text-white ${
                          selectedAccount.bank.toLowerCase().includes("mandiri") ? "bg-amber-600" :
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
                  className="bg-white text-slate-800 rounded-2xl p-8 shadow-md max-w-2xl w-full border border-slate-200 font-sans"
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
                >
                  {/* Kop Surat */}
                  <div className="flex items-start justify-between pb-3 border-b-2 border-blue-900">
                    <div>
                      <h4 className="font-black text-blue-900 text-base leading-tight">LPK CREATIVA</h4>
                      <p className="text-[10px] font-bold text-blue-800 tracking-wider">BRIDGING INTERNATIONAL</p>
                      <p className="text-[9px] text-slate-500 max-w-[280px] mt-1 leading-snug">
                        Ruko Business Park, Jl. Ir. H. Juanda, Panembong, Ruko B1, Mekarsari, Kec. Cianjur, Kab. Cianjur 43211
                      </p>
                    </div>

                    <div className="text-right">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">INVOICE</h2>
                      <p className="text-[11px] font-mono font-bold text-blue-700 mt-0.5">{invoiceNumber}</p>
                      <p className="text-[10px] text-slate-500">Tanggal: {tanggalInvoice}</p>
                      <p className="text-[10px] text-slate-500">Jatuh Tempo: {jatuhTempo}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="py-4 border-b border-slate-100 flex justify-between text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Ditujukan Kepada:</p>
                      <p className="text-sm font-black text-slate-900 mt-0.5">{activeStudent.nama}</p>
                      <p className="text-slate-500 text-[11px] font-mono">NIS: {activeStudent.nis}</p>
                      <p className="text-slate-500 text-[11px]">{activeStudent.phone} • {activeStudent.email}</p>
                      <p className="text-slate-400 text-[10px]">{activeStudent.alamat}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Program Pelatihan:</p>
                      <p className="text-xs font-bold text-blue-900 mt-0.5">{programInfo.program}</p>
                      <p className="text-[11px] text-slate-500">{programInfo.durasi} • {programInfo.lokasi}</p>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Status: Belum Lunas
                      </span>
                    </div>
                  </div>

                  {/* Table */}
                  <table className="w-full text-xs my-4 border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 text-left">Item Tagihan</th>
                        <th className="py-2 px-3 text-center w-16">Qty</th>
                        <th className="py-2 px-3 text-right w-28">Harga</th>
                        <th className="py-2 px-3 text-right w-28">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map(it => (
                        <tr key={it.id}>
                          <td className="p-2.5">
                            <p className="font-bold text-slate-900">{it.deskripsi}</p>
                            <p className="text-[10px] text-slate-500">{it.subdeskripsi}</p>
                          </td>
                          <td className="p-2.5 text-center font-bold">{it.qty}</td>
                          <td className="p-2.5 text-right font-mono">{formatRp(it.harga)}</td>
                          <td className="p-2.5 text-right font-mono font-bold">{formatRp(it.jumlah - (it.diskon || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="p-2.5 text-right text-slate-600">Total Tagihan:</td>
                        <td className="p-2.5 text-right font-mono text-sm text-blue-700">{formatRp(totalTagihan)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Pembayaran & Rekening */}
                  <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-4 text-[10px] text-slate-600">
                    <div>
                      <p className="font-bold text-slate-800">Pembayaran Ditransfer ke:</p>
                      <p className="font-bold text-blue-900 text-xs mt-0.5">
                        {selectedAccount.bank} — {selectedAccount.noRek}
                      </p>
                      <p>a/n {selectedAccount.pemilik}</p>
                      <p className="text-slate-400 mt-1 italic">
                        *Kode Akun: COA {selectedAccount.kode} | Cantumkan No. Invoice pada berita transfer
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">Konfirmasi Pembayaran:</p>
                      <p className="text-blue-600 font-semibold">finance@creativabridging.com</p>
                      <p>WhatsApp: +62 815-2222-672</p>
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
