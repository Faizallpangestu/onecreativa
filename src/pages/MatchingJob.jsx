import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { useSEO } from "../hooks/useSEO";
import {
  Briefcase,
  Users,
  Search,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Eye,
  FileText,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  UploadCloud,
  ChevronDown,
  Phone,
  Mail,
  Building2,
  Calendar,
  ExternalLink,
  Download,
  Filter,
  UserCheck,
  Plane,
  Sparkles,
  MapPin,
  DollarSign,
  Check,
  CheckSquare,
  Square,
  Layers,
  Tag,
  Info,
  ChevronRight,
  TrendingUp,
  Coins,
  ShieldCheck,
  FileCheck
} from "lucide-react";
import * as XLSX from "xlsx-js-style";
import Swal from "sweetalert2";

const API_URL = "/api/lpk_matching.php";

// Pipeline progress steps and styling
const PROGRESS_OPTIONS = [
  { value: "Pendaftaran", label: "Pendaftaran Berkas", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-400" },
  { value: "Screening Berkas", label: "Screening Berkas", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  { value: "Matching Job", label: "Matching Job", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
  { value: "Interview User", label: "Interview User", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  { value: "Lolos Interview", label: "Lolos Interview", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  { value: "Proses MCU", label: "Proses MCU (Kesehatan)", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  { value: "Pengajuan CoE", label: "Pengajuan CoE", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", dot: "bg-cyan-500" },
  { value: "Pengajuan Visa", label: "Pengajuan Visa", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500" },
  { value: "Siap Terbang", label: "Siap Terbang / Berangkat", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-600" },
  { value: "Gagal / Batal", label: "Gagal / Mengundurkan Diri", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" }
];

const BIDANG_OPTIONS = [
  "Keperawatan (Kaigo / Caregiver)",
  "Pengolahan Makanan & Minuman",
  "Pertanian & Perkebunan",
  "Peternakan",
  "Konstruksi & Bangunan",
  "Manufaktur & Mesin",
  "Pelayanan Restoran / F&B",
  "Akomodasi & Perhotelan",
  "Pembersihan Gedung",
  "Otomotif & Perbengkelan",
  "Perikanan & Kelautan",
  "Pengemasan Industri & Logistik",
  "Tekstil & Garmen",
  "Lainnya"
];

// Bidang Job Jepang Resmi (Tokutei Ginou / SSW & Magang)
const JAPAN_JOB_SECTORS = [
  {
    key: "KAIGO",
    label: "KAIGO (Keperawatan / Caregiver / Perawat Lansia)",
    bidang: "Keperawatan (Kaigo / Caregiver)",
    defaultTsk: "TSK Zenkoku Care Support Japan",
    defaultBiaya: "25000000",
    icon: "🏥",
    gaji: "¥200,000 - ¥240,000 / bln"
  },
  {
    key: "PENGOLAHAN_MAKANAN",
    label: "PENGOLAHAN MAKANAN (Food Processing / Pabrik Bento & Olahan)",
    bidang: "Pengolahan Makanan & Minuman",
    defaultTsk: "TSK Mirai Bridge Osaka",
    defaultBiaya: "22000000",
    icon: "🍱",
    gaji: "¥195,000 - ¥225,000 / bln"
  },
  {
    key: "PERTANIAN",
    label: "PERTANIAN (Pertanian Sayur, Buah & Hidroponik)",
    bidang: "Pertanian & Perkebunan",
    defaultTsk: "LPK Nihon Agricultural Partner",
    defaultBiaya: "20000000",
    icon: "🌾",
    gaji: "¥185,000 - ¥215,000 / bln"
  },
  {
    key: "PETERNAKAN",
    label: "PETERNAKAN (Peternakan Sapi Perah, Unggas & Pakan)",
    bidang: "Peternakan",
    defaultTsk: "TSK Chikusan Support Hokkaido",
    defaultBiaya: "21000000",
    icon: "🐄",
    gaji: "¥195,000 - ¥225,000 / bln"
  },
  {
    key: "KONSTRUKSI",
    label: "KONSTRUKSI (Konstruksi, Scaffolding / Tobi & Bangunan)",
    bidang: "Konstruksi & Bangunan",
    defaultTsk: "Kumiai Kensetsu Japan Chiba",
    defaultBiaya: "21000000",
    icon: "🏗️",
    gaji: "¥220,000 - ¥260,000 / bln"
  },
  {
    key: "MANUFAKTUR_MESIN",
    label: "MANUFAKTUR & MESIN (Fabrikasi Logam, Mesin & Casting)",
    bidang: "Manufaktur & Mesin",
    defaultTsk: "TSK Chubu Industrial Support",
    defaultBiaya: "24000000",
    icon: "⚙️",
    gaji: "¥205,000 - ¥235,000 / bln"
  },
  {
    key: "RESTORAN",
    label: "RESTORAN / FOOD SERVICE (Pelayanan Restoran Jepang & Dapur)",
    bidang: "Pelayanan Restoran / F&B",
    defaultTsk: "TSK Gourmet Support Tokyo",
    defaultBiaya: "23000000",
    icon: "🍜",
    gaji: "¥195,000 - ¥230,000 / bln"
  },
  {
    key: "AKOMODASI_PERHOTELAN",
    label: "AKOMODASI & PERHOTELAN (Hotel, Ryokan & Hospitality)",
    bidang: "Akomodasi & Perhotelan",
    defaultTsk: "TSK Omotenashi Hospitality Japan",
    defaultBiaya: "24000000",
    icon: "🏨",
    gaji: "¥200,000 - ¥230,000 / bln"
  },
  {
    key: "PEMBERSIHAN_GEDUNG",
    label: "PEMBERSIHAN GEDUNG (Building Cleaning Service)",
    bidang: "Pembersihan Gedung",
    defaultTsk: "TSK Clean Environment Service",
    defaultBiaya: "22000000",
    icon: "🧹",
    gaji: "¥190,000 - ¥215,000 / bln"
  },
  {
    key: "OTOMOTIF",
    label: "OTOMOTIF & PERAWATAN MOBIL (Teknisi Bengkel & Body Repair)",
    bidang: "Otomotif & Perbengkelan",
    defaultTsk: "TSK J-Auto Maintenance",
    defaultBiaya: "25000000",
    icon: "🚗",
    gaji: "¥210,000 - ¥245,000 / bln"
  },
  {
    key: "PERIKANAN",
    label: "PERIKANAN & PENGOLAHAN HASIL LAUT (Fishery & Seafood Processing)",
    bidang: "Perikanan & Kelautan",
    defaultTsk: "TSK Suisan Kaiyou Support",
    defaultBiaya: "21000000",
    icon: "🐟",
    gaji: "¥190,000 - ¥220,000 / bln"
  },
  {
    key: "PENGEMASAN_LOGISTIK",
    label: "PENGEMASAN INDUSTRI & LOGISTIK (Warehouse, Sortir & Packing)",
    bidang: "Pengemasan Industri & Logistik",
    defaultTsk: "TSK Logistics Nihon Support",
    defaultBiaya: "22000000",
    icon: "📦",
    gaji: "¥195,000 - ¥225,000 / bln"
  },
  {
    key: "TEKSTIL_GARMEN",
    label: "TEKSTIL & GARMEN (Jahit & Industri Pakaian Jadi)",
    bidang: "Tekstil & Garmen",
    defaultTsk: "Kumiai Sen-i Gifu",
    defaultBiaya: "20000000",
    icon: "🧵",
    gaji: "¥185,000 - ¥215,000 / bln"
  },
  {
    key: "LAINNYA",
    label: "JOB JEPANG LAINNYA (Ketik / Tentukan Sendiri)",
    bidang: "Lainnya",
    defaultTsk: "",
    defaultBiaya: "22000000",
    icon: "🇯🇵",
    gaji: "¥190,000 - ¥230,000 / bln"
  }
];

const SOURCE_TYPES = [
  { value: "TSK", label: "TSK (登録支援機関 - Registered Support Org)", short: "TSK", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "LPK Mitra", label: "LPK Mitra / Rekanan", short: "LPK Mitra", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "Kumiai", label: "Kumiai / AO (Asosiasi)", short: "Kumiai", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "Perusahaan", label: "Perusahaan Jepang Langsung", short: "Perusahaan", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" }
];

const PRESET_INCLUDES = [
  "Pengurusan CoE & Visa Tokutei Ginou",
  "Tiket Pesawat ke Jepang (One-Way)",
  "Medical Check-Up (MCU) Keberangkatan",
  "Pelatihan Bahasa & Mentoring Mensaetsu",
  "Penerjemahan & Legalisir Dokumen",
  "Penjemputan di Bandara Haneda/Narita/Kansai",
  "Asuransi Perjalanan & Perlindungan Kerja",
  "Pembuatan Zairyu Card & Akun Bank Jepang",
  "Bantuan Penempatan Asrama / Apartemen",
  "Seragam & Perlengkapan Kerja Awal"
];

const DEFAULT_LPK_PENGIRIM = [
  "LPK Creativa Bridging International",
  "LPK SAGARA",
  "LPK AOKI GAKKOU",
  "LPK PRAMUDITA",
  "LPK ASSAHI BUNTONI",
  "LPK INSAN CITA INTERNATIONAL",
  "LPK JGI",
  "LPK ORI",
  "LPK ONEGAI"
];

const formatRupiah = (val) => {
  if (val === null || val === undefined || isNaN(val) || val === "") return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(val);
};

export default function MatchingJob() {
  useSEO({
    title: "Matching Job & Pipeline Kandidat Jepang",
    description: "Kelola lowongan kerja Jepang Tokutei Ginou / Magang, TSK, LPK pengirim kandidat, dan rincian biaya penempatan."
  });

  // Navigation Tabs: 'candidates' | 'biaya_table' | 'jobs' | 'summary'
  const [activeTab, setActiveTab] = useState("candidates");

  // Candidates & Jobs State
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [lpkList, setLpkList] = useState([]);
  const [studentOptions, setStudentOptions] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProgress, setFilterProgress] = useState("Semua");
  const [filterLpk, setFilterLpk] = useState("Semua");
  const [filterJob, setFilterJob] = useState("Semua");
  const [filterJobSource, setFilterJobSource] = useState("Semua");

  // Filters for Tabel Biaya Job
  const [searchBiaya, setSearchBiaya] = useState("");
  const [filterBiayaBidang, setFilterBiayaBidang] = useState("Semua");

  // Modal State: Candidate Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  // Modal State: Job Form
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobModalMode, setJobModalMode] = useState("create"); // 'create' | 'edit'
  const [selectedJobDetail, setSelectedJobDetail] = useState(null);
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);

  // Candidate Form Fields
  const [formId, setFormId] = useState(null);
  const [namaLengkap, setNamaLengkap] = useState("");
  const [usia, setUsia] = useState("");
  const [lpkPengirim, setLpkPengirim] = useState(DEFAULT_LPK_PENGIRIM[0]);
  const [customLpk, setCustomLpk] = useState("");
  const [isCustomLpk, setIsCustomLpk] = useState(false);
  const [tskName, setTskName] = useState("");
  const [bidang, setBidang] = useState(BIDANG_OPTIONS[0]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [biayaMatchingCandidate, setBiayaMatchingCandidate] = useState("");
  const [candidateIncludes, setCandidateIncludes] = useState([...PRESET_INCLUDES]);
  const [noWa, setNoWa] = useState("");
  const [email, setEmail] = useState("");
  const [progress, setProgress] = useState("Pendaftaran");
  const [catatan, setCatatan] = useState("");

  // Files State for Candidate
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [sswFile, setSswFile] = useState(null);
  const [jftFile, setJftFile] = useState(null);
  const [jlptFile, setJlptFile] = useState(null);
  const [existingFiles, setExistingFiles] = useState({
    foto: null,
    file_cv: null,
    file_ssw: null,
    file_jft: null,
    file_jlpt: null
  });

  // Job Form Fields
  const [jobFormId, setJobFormId] = useState(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobBidang, setJobBidang] = useState(BIDANG_OPTIONS[0]);
  const [jobSourceType, setJobSourceType] = useState("TSK");
  const [jobSourceName, setJobSourceName] = useState("");
  const [jobSourcePic, setJobSourcePic] = useState("");
  const [jobSourceContact, setJobSourceContact] = useState("");
  const [jobLokasiJepang, setJobLokasiJepang] = useState("");
  const [jobKuota, setJobKuota] = useState("5");
  const [jobTotalBiaya, setJobTotalBiaya] = useState("25000000");
  const [jobCurrency, setJobCurrency] = useState("IDR");
  const [jobIncludeItems, setJobIncludeItems] = useState([
    "Pengurusan CoE & Visa Tokutei Ginou",
    "Tiket Pesawat ke Jepang (One-Way)",
    "Medical Check-Up (MCU) Keberangkatan",
    "Pelatihan Bahasa & Mentoring Mensaetsu",
    "Penerjemahan & Legalisir Dokumen",
    "Penjemputan di Bandara Haneda/Narita/Kansai",
    "Asuransi Perjalanan & Perlindungan Kerja",
    "Pembuatan Zairyu Card & Akun Bank Jepang"
  ]);
  const [customIncludeInput, setCustomIncludeInput] = useState("");
  const [jobIncludeCustom, setJobIncludeCustom] = useState("");
  const [jobExcludeItems, setJobExcludeItems] = useState("Biaya paspor mandiri & uang saku pribadi");
  const [jobEstimasiGaji, setJobEstimasiGaji] = useState("¥195,000 - ¥230,000 / bulan");
  const [jobPersyaratan, setJobPersyaratan] = useState("Sertifikat SSW bidang terkait, JFT-Basic A2 atau JLPT N4");
  const [jobStatus, setJobStatus] = useState("open");
  const [jobDeskripsi, setJobDeskripsi] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // File input refs
  const fotoInputRef = useRef(null);
  const cvInputRef = useRef(null);
  const sswInputRef = useRef(null);
  const jftInputRef = useRef(null);

  // Fetch all initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [candRes, jobsRes, lpkRes, studentsRes] = await Promise.all([
        axios.get(API_URL).catch(() => ({ data: { status: "success", data: [] } })),
        axios.get(API_URL + "?view=jobs").catch(() => ({ data: { status: "success", data: [] } })),
        axios.get(API_URL + "?view=lpk_list").catch(() => ({ data: { status: "success", data: [] } })),
        axios.get(API_URL + "?view=students").catch(() => ({ data: { status: "success", data: [] } }))
      ]);

      if (candRes.data?.status === "success" && Array.isArray(candRes.data.data)) {
        setCandidates(candRes.data.data);
      }
      if (jobsRes.data?.status === "success" && Array.isArray(jobsRes.data.data)) {
        setJobs(jobsRes.data.data);
      }
      if (lpkRes.data?.status === "success" && Array.isArray(lpkRes.data.data)) {
        setLpkList(lpkRes.data.data);
      }
      if (studentsRes.data?.status === "success" && Array.isArray(studentsRes.data.data)) {
        setStudentOptions(studentsRes.data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data matching job:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getFileUrl = (fileName) => {
    if (!fileName) return null;
    for (const c of candidates) {
      for (const field of ["foto", "file_cv", "file_ssw", "file_jft", "file_jlpt"]) {
        if (c[field] === fileName) return API_URL + "?view=file&id=" + c.id + "&field=" + field;
      }
    }
    return null;
  };

  const getProgressMeta = (statusName) => {
    return (
      PROGRESS_OPTIONS.find((p) => p.value === statusName) || {
        value: statusName || "Pendaftaran",
        label: statusName || "Pendaftaran",
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-400"
      }
    );
  };

  // ==========================================
  // CANDIDATE FORM HANDLERS
  // ==========================================
  const resetCandidateForm = () => {
    setFormId(null);
    setStudentId("");
    setNamaLengkap("");
    setUsia("");
    setLpkPengirim(DEFAULT_LPK_PENGIRIM[0]);
    setCustomLpk("");
    setIsCustomLpk(false);
    setTskName("");
    setBidang(BIDANG_OPTIONS[0]);
    setSelectedJobId("");
    setBiayaMatchingCandidate("");
    setCandidateIncludes([...PRESET_INCLUDES]);
    setNoWa("");
    setEmail("");
    setProgress("Pendaftaran");
    setCatatan("");
    setFotoFile(null);
    setFotoPreview(null);
    setCvFile(null);
    setSswFile(null);
    setJftFile(null);
    setJlptFile(null);
    setExistingFiles({
      foto: null,
      file_cv: null,
      file_ssw: null,
      file_jft: null,
      file_jlpt: null
    });
  };

  const handleOpenCreateCandidate = (presetJobId = "") => {
    resetCandidateForm();
    if (presetJobId) {
      setSelectedJobId(String(presetJobId));
      const targetJob = jobs.find((j) => String(j.id) === String(presetJobId));
      if (targetJob) {
        setBidang(targetJob.bidang || BIDANG_OPTIONS[0]);
        setBiayaMatchingCandidate(targetJob.total_biaya || "");
        setTskName(targetJob.source_name || "");
        if (Array.isArray(targetJob.include_items_array) && targetJob.include_items_array.length > 0) {
          setCandidateIncludes([...targetJob.include_items_array]);
        }
      }
    }
    setModalMode("create");
    setIsModalOpen(true);
  };

  const handleOpenEditCandidate = (cand) => {
    resetCandidateForm();
    setModalMode("edit");
    setFormId(cand.id);
    setNamaLengkap(cand.nama_lengkap || "");
    setUsia(cand.usia !== null && cand.usia !== undefined ? String(cand.usia) : "");
    const rawLpk = cand.lpk_pengirim || "";
    if (DEFAULT_LPK_PENGIRIM.includes(rawLpk)) {
      setLpkPengirim(rawLpk);
      setIsCustomLpk(false);
      setCustomLpk("");
    } else if (rawLpk) {
      setLpkPengirim("__custom__");
      setIsCustomLpk(true);
      setCustomLpk(rawLpk);
    } else {
      setLpkPengirim(DEFAULT_LPK_PENGIRIM[0]);
      setIsCustomLpk(false);
      setCustomLpk("");
    }
    setTskName(cand.tsk_name || cand.source_name || "");
    setBidang(cand.bidang || BIDANG_OPTIONS[0]);
    setSelectedJobId(cand.job_id ? String(cand.job_id) : "");
    setBiayaMatchingCandidate(cand.biaya_matching !== null && cand.biaya_matching !== undefined ? String(cand.biaya_matching) : "");
    if (Array.isArray(cand.effective_includes) && cand.effective_includes.length > 0) {
      setCandidateIncludes([...cand.effective_includes]);
    } else {
      setCandidateIncludes([...PRESET_INCLUDES]);
    }
    setNoWa(cand.no_wa || "");
    setEmail(cand.email || "");
    setProgress(cand.progress || "Pendaftaran");
    setCatatan(cand.catatan || "");
    setStudentId(cand.student_id || "");
    setExistingFiles({
      foto: cand.foto,
      file_cv: cand.file_cv,
      file_ssw: cand.file_ssw,
      file_jft: cand.file_jft,
      file_jlpt: cand.file_jlpt
    });
    if (cand.foto) {
      setFotoPreview(getFileUrl(cand.foto));
    }
    setIsModalOpen(true);
  };

  const handleJobSelectChange = (jobId) => {
    setSelectedJobId(jobId);
    if (!jobId) {
      return;
    }

    // 1. If user selected a preset Japanese job sector (KAIGO, PENGOLAHAN MAKANAN, PERTANIAN, PETERNAKAN, dll)
    if (jobId.startsWith("sector:")) {
      const sectorKey = jobId.replace("sector:", "");
      const foundSector = JAPAN_JOB_SECTORS.find((s) => s.key === sectorKey);
      if (foundSector) {
        setBidang(foundSector.bidang);
        if (foundSector.defaultTsk) {
          setTskName(foundSector.defaultTsk);
        }
        if (foundSector.defaultBiaya) {
          setBiayaMatchingCandidate(foundSector.defaultBiaya);
        }

        // Auto-match with active jobs if available
        const matchingJob = jobs.find(
          (j) =>
            j.bidang === foundSector.bidang ||
            j.job_title?.toLowerCase().includes(sectorKey.toLowerCase()) ||
            foundSector.label.toLowerCase().includes(j.job_title?.toLowerCase())
        );
        if (matchingJob && Array.isArray(matchingJob.include_items_array) && matchingJob.include_items_array.length > 0) {
          setCandidateIncludes([...matchingJob.include_items_array]);
        }
      }
      return;
    }

    // 2. If user selected a specific active job from database
    const foundJob = jobs.find((j) => String(j.id) === String(jobId));
    if (foundJob) {
      setBidang(foundJob.bidang);
      if (foundJob.source_name) {
        setTskName(foundJob.source_name);
      }
      setBiayaMatchingCandidate(foundJob.total_biaya || "");
      if (Array.isArray(foundJob.include_items_array) && foundJob.include_items_array.length > 0) {
        setCandidateIncludes([...foundJob.include_items_array]);
      }
    }
  };

  const handleSubmitCandidate = async (e) => {
    e.preventDefault();
    if (!namaLengkap.trim()) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Nama Kandidat wajib diisi." });
      return;
    }
    const effectiveLpk = isCustomLpk ? customLpk.trim() : lpkPengirim.trim();
    if (!effectiveLpk) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "LPK Pengirim Kandidat wajib dipilih atau diisi." });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("nama_lengkap", namaLengkap.trim());
    if (studentId) formData.append("student_id", studentId);
    if (usia) formData.append("usia", usia);
    formData.append("lpk_pengirim", effectiveLpk);
    if (tskName) formData.append("tsk_name", tskName.trim());
    if (bidang) formData.append("bidang", bidang);

    let effectiveJobId = selectedJobId;
    if (selectedJobId && selectedJobId.startsWith("sector:")) {
      const sectorKey = selectedJobId.replace("sector:", "");
      const foundSector = JAPAN_JOB_SECTORS.find((s) => s.key === sectorKey);
      const matchingJob = jobs.find(
        (j) =>
          j.bidang === foundSector?.bidang ||
          j.job_title?.toLowerCase().includes(sectorKey.toLowerCase())
      );
      effectiveJobId = matchingJob ? String(matchingJob.id) : "";
    }
    if (effectiveJobId) formData.append("job_id", effectiveJobId);
    if (biayaMatchingCandidate) formData.append("biaya_matching", biayaMatchingCandidate);
    if (candidateIncludes.length > 0) formData.append("include_fasilitas", JSON.stringify(candidateIncludes));
    if (noWa) formData.append("no_wa", noWa.trim());
    if (email) formData.append("email", email.trim());
    formData.append("progress", progress);
    if (catatan) formData.append("catatan", catatan);

    if (modalMode === "edit" && formId) {
      formData.append("id", formId);
      formData.append("action", "update");
    }

    if (fotoFile) formData.append("foto", fotoFile);
    if (cvFile) formData.append("file_cv", cvFile);
    if (sswFile) formData.append("file_ssw", sswFile);
    if (jftFile) formData.append("file_jft", jftFile);
    if (jlptFile) formData.append("file_jlpt", jlptFile);

    try {
      const res = await axios.post(API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data && res.data.status === "success") {
        Swal.fire({
          icon: "success",
          title: "Berhasil Disimpan!",
          text: modalMode === "edit" ? "Data kandidat berhasil diperbarui." : "Kandidat baru berhasil ditambahkan dan ditautkan ke Lowongan Job.",
          timer: 1800,
          showConfirmButton: false
        });
        setIsModalOpen(false);
        resetCandidateForm();
        fetchData();
      } else {
        throw new Error(res.data?.message || "Gagal menyimpan data.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: error.response?.data?.message || error.message || "Terjadi kesalahan sistem saat menyimpan."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (candId, newProgress) => {
    const decision = await Swal.fire({
      title: "Catatan perubahan progress",
      input: "textarea",
      placeholder: "Contoh: Lolos seleksi dokumen oleh TSK / User Jepang...",
      showCancelButton: true,
      inputValidator: (v) => (v?.trim() ? undefined : "Catatan hasil/review wajib diisi.")
    });
    if (!decision.isConfirmed) return;
    try {
      const res = await axios.post(API_URL, {
        action: "update_progress",
        id: candId,
        progress: newProgress,
        notes: decision.value
      });
      if (res.data && res.data.status === "success") {
        setCandidates((prev) =>
          prev.map((item) => (item.id === candId ? { ...item, progress: newProgress } : item))
        );
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: `Progress diubah ke ${newProgress}`,
          showConfirmButton: false,
          timer: 2000
        });
        fetchData();
      }
    } catch (error) {
      console.error("Gagal update status:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Update",
        text: error.response?.data?.message || "Tidak dapat mengubah status progress."
      });
    }
  };

  // ==========================================
  // JOB ORDER FORM HANDLERS
  // ==========================================
  const resetJobForm = () => {
    setJobFormId(null);
    setJobTitle("");
    setJobBidang(BIDANG_OPTIONS[0]);
    setJobSourceType("TSK");
    setJobSourceName("");
    setJobSourcePic("");
    setJobSourceContact("");
    setJobLokasiJepang("Tokyo-to");
    setJobKuota("5");
    setJobTotalBiaya("25000000");
    setJobCurrency("IDR");
    setJobIncludeItems([
      "Pengurusan CoE & Visa Tokutei Ginou",
      "Tiket Pesawat ke Jepang (One-Way)",
      "Medical Check-Up (MCU) Keberangkatan",
      "Pelatihan Bahasa & Mentoring Mensaetsu",
      "Penerjemahan & Legalisir Dokumen",
      "Penjemputan di Bandara Haneda/Narita/Kansai",
      "Asuransi Perjalanan & Perlindungan Kerja",
      "Pembuatan Zairyu Card & Akun Bank Jepang"
    ]);
    setCustomIncludeInput("");
    setJobIncludeCustom("");
    setJobExcludeItems("Biaya paspor mandiri & uang saku pribadi");
    setJobEstimasiGaji("¥195,000 - ¥230,000 / bulan");
    setJobPersyaratan("Sertifikat SSW bidang terkait, JFT-Basic A2 atau JLPT N4");
    setJobStatus("open");
    setJobDeskripsi("");
  };

  const handleOpenCreateJob = () => {
    resetJobForm();
    setJobModalMode("create");
    setIsJobModalOpen(true);
  };

  const handleOpenEditJob = (job) => {
    resetJobForm();
    setJobModalMode("edit");
    setJobFormId(job.id);
    setJobTitle(job.job_title || "");
    setJobBidang(job.bidang || BIDANG_OPTIONS[0]);
    setJobSourceType(job.source_type || "TSK");
    setJobSourceName(job.source_name || "");
    setJobSourcePic(job.source_pic || "");
    setJobSourceContact(job.source_contact || "");
    setJobLokasiJepang(job.lokasi_jepang || "");
    setJobKuota(job.kuota ? String(job.kuota) : "1");
    setJobTotalBiaya(job.total_biaya ? String(Math.round(job.total_biaya)) : "0");
    setJobCurrency(job.currency || "IDR");
    setJobIncludeItems(Array.isArray(job.include_items_array) ? job.include_items_array : []);
    setJobIncludeCustom(job.include_custom || "");
    setJobExcludeItems(job.exclude_items || "");
    setJobEstimasiGaji(job.estimasi_gaji || "");
    setJobPersyaratan(job.persyaratan || "");
    setJobStatus(job.status || "open");
    setJobDeskripsi(job.deskripsi || "");
    setIsJobModalOpen(true);
  };

  const handleToggleIncludeItem = (item) => {
    setJobIncludeItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleAddCustomInclude = () => {
    if (!customIncludeInput.trim()) return;
    if (!jobIncludeItems.includes(customIncludeInput.trim())) {
      setJobIncludeItems((prev) => [...prev, customIncludeInput.trim()]);
    }
    setCustomIncludeInput("");
  };

  const handleSubmitJob = async (e) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobSourceName.trim() || !jobLokasiJepang.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Judul Pekerjaan, Asal Lembaga (TSK/LPK), dan Lokasi di Jepang wajib diisi."
      });
      return;
    }

    setIsSubmitting(true);
    const payload = {
      action: jobModalMode === "edit" ? "update_job" : "create_job",
      id: jobModalMode === "edit" ? jobFormId : undefined,
      job_title: jobTitle.trim(),
      bidang: jobBidang,
      source_type: jobSourceType,
      source_name: jobSourceName.trim(),
      source_pic: jobSourcePic.trim(),
      source_contact: jobSourceContact.trim(),
      lokasi_jepang: jobLokasiJepang.trim(),
      kuota: parseInt(jobKuota, 10) || 1,
      total_biaya: parseFloat(jobTotalBiaya) || 0,
      currency: jobCurrency,
      include_items: jobIncludeItems,
      include_custom: jobIncludeCustom.trim(),
      exclude_items: jobExcludeItems.trim(),
      estimasi_gaji: jobEstimasiGaji.trim(),
      persyaratan: jobPersyaratan.trim(),
      status: jobStatus,
      deskripsi: jobDeskripsi.trim()
    };

    try {
      const res = await axios.post(API_URL, payload);
      if (res.data && res.data.status === "success") {
        Swal.fire({
          icon: "success",
          title: "Lowongan Berhasil Disimpan!",
          text: jobModalMode === "edit" ? "Data lowongan kerja berhasil diperbarui." : "Lowongan JOB baru berhasil ditambahkan.",
          timer: 1800,
          showConfirmButton: false
        });
        setIsJobModalOpen(false);
        resetJobForm();
        fetchData();
      } else {
        throw new Error(res.data?.message || "Gagal menyimpan lowongan.");
      }
    } catch (error) {
      console.error("Gagal menyimpan lowongan:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: error.response?.data?.message || error.message || "Terjadi kesalahan saat menyimpan lowongan."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (job) => {
    const res = await Swal.fire({
      title: "Hapus Lowongan Job?",
      html: `Apakah Anda yakin ingin menghapus atau menutup lowongan <b>"${job.job_title}"</b> dari <b>${job.source_name}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Proses!",
      cancelButtonText: "Batal"
    });

    if (res.isConfirmed) {
      try {
        const delRes = await axios.post(API_URL, { action: "delete_job", id: job.id });
        if (delRes.data?.status === "success") {
          Swal.fire({
            icon: "success",
            title: "Selesai",
            text: delRes.data?.data?.message || "Lowongan berhasil dihapus/ditutup."
          });
          fetchData();
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Gagal Menghapus",
          text: err.response?.data?.message || "Tidak dapat menghapus lowongan."
        });
      }
    }
  };

  // ==========================================
  // DETAIL & PREVIEWS
  // ==========================================
  const handleOpenCandidateDetail = (cand) => {
    setSelectedCandidate(cand);
    setIsDetailOpen(true);
    setHistory([]);
    axios
      .get(API_URL + "?view=history&id=" + cand.id)
      .then((r) => {
        if (r.data.status === "success") setHistory(r.data.data);
      })
      .catch((e) => console.error(e));
  };

  const handleOpenJobDetail = (job) => {
    setSelectedJobDetail(job);
    setIsJobDetailOpen(true);
  };

  const handlePreview = (url, name) => {
    if (!url) return;
    const ext = name?.split(".").pop()?.toLowerCase() || "";
    const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
    const isPdf = ext === "pdf";
    setPreviewFile({ url, name, isImage, isPdf });
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredCandidates.length === 0) {
      Swal.fire({ icon: "info", title: "Tidak Ada Data", text: "Tidak ada data kandidat untuk diekspor." });
      return;
    }

    const exportData = filteredCandidates.map((c, idx) => ({
      No: idx + 1,
      "Nama Kandidat": c.nama_lengkap,
      Usia: c.usia ? `${c.usia} Tahun` : "-",
      "LPK Pengirim": c.lpk_pengirim || "-",
      "Job yang Dilamar": c.job_title || "-",
      "Asal Job (TSK/LPK)": c.source_name ? `[${c.source_type}] ${c.source_name}` : "-",
      "Lokasi Jepang": c.lokasi_jepang || "-",
      "Total Biaya Matching": formatRupiah(c.biaya_matching_efektif || c.total_biaya),
      "Fasilitas Include": Array.isArray(c.effective_includes) ? c.effective_includes.join(", ") : "-",
      "Bidang SSW": c.bidang || "-",
      "No. WhatsApp": c.no_wa || "-",
      Email: c.email || "-",
      Progress: c.progress || "Pendaftaran",
      Catatan: c.catatan || "-",
      "Tanggal Daftar": c.created_at ? new Date(c.created_at).toLocaleDateString("id-ID") : "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Matching Job");
    XLSX.writeFile(workbook, `Data_Matching_Job_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Filter Candidates
  const filteredCandidates = candidates.filter((item) => {
    const keyword = searchQuery.toLowerCase();
    const matchSearch =
      (item.nama_lengkap && item.nama_lengkap.toLowerCase().includes(keyword)) ||
      (item.lpk_pengirim && item.lpk_pengirim.toLowerCase().includes(keyword)) ||
      (item.job_title && item.job_title.toLowerCase().includes(keyword)) ||
      (item.source_name && item.source_name.toLowerCase().includes(keyword)) ||
      (item.bidang && item.bidang.toLowerCase().includes(keyword)) ||
      (item.no_wa && item.no_wa.toLowerCase().includes(keyword));

    const matchProgress = filterProgress === "Semua" || item.progress === filterProgress;
    const matchLpk = filterLpk === "Semua" || item.lpk_pengirim === filterLpk;
    const matchJob = filterJob === "Semua" || String(item.job_id) === String(filterJob);

    return matchSearch && matchProgress && matchLpk && matchJob;
  });

  // Filter Jobs
  const filteredJobs = jobs.filter((job) => {
    const keyword = searchQuery.toLowerCase();
    const matchSearch =
      (job.job_title && job.job_title.toLowerCase().includes(keyword)) ||
      (job.source_name && job.source_name.toLowerCase().includes(keyword)) ||
      (job.lokasi_jepang && job.lokasi_jepang.toLowerCase().includes(keyword)) ||
      (job.bidang && job.bidang.toLowerCase().includes(keyword));

    const matchSource = filterJobSource === "Semua" || job.source_type === filterJobSource;
    return matchSearch && matchSource;
  });

  // Filter Jobs for Tabel Biaya Job
  const filteredBiayaJobs = jobs.filter((job) => {
    const keyword = searchBiaya.toLowerCase().trim();
    const matchSearch =
      !keyword ||
      (job.job_title && job.job_title.toLowerCase().includes(keyword)) ||
      (job.source_name && job.source_name.toLowerCase().includes(keyword)) ||
      (job.lokasi_jepang && job.lokasi_jepang.toLowerCase().includes(keyword)) ||
      (job.bidang && job.bidang.toLowerCase().includes(keyword)) ||
      (job.estimasi_gaji && job.estimasi_gaji.toLowerCase().includes(keyword));

    const matchBidang = filterBiayaBidang === "Semua" || job.bidang === filterBiayaBidang;
    return matchSearch && matchBidang;
  });

  const validBiayaList = jobs.map((j) => Number(j.total_biaya) || 0).filter((b) => b > 0);
  const avgBiaya = validBiayaList.length ? Math.round(validBiayaList.reduce((a, b) => a + b, 0) / validBiayaList.length) : 0;
  const minBiaya = validBiayaList.length ? Math.min(...validBiayaList) : 0;
  const maxBiaya = validBiayaList.length ? Math.max(...validBiayaList) : 0;
  const totalKuotaJobs = jobs.reduce((acc, curr) => acc + (Number(curr.kuota) || 0), 0);
  const uniqueTskCount = Array.from(new Set(jobs.map((j) => j.source_name?.trim()).filter(Boolean))).length;

  // Distinct LPKs list from candidates
  const allLpksFromData = Array.from(new Set(candidates.map((c) => c.lpk_pengirim?.trim()).filter(Boolean)));
  const combinedLpkOptions = Array.from(new Set(["Semua", ...DEFAULT_LPK_PENGIRIM, ...lpkList, ...allLpksFromData]));

  // Statistics KPI
  const totalKandidat = candidates.length;
  const inMatching = candidates.filter((c) => ["Matching Job", "Interview User", "Screening Berkas"].includes(c.progress)).length;
  const lolosDanMcu = candidates.filter((c) => ["Lolos Interview", "Proses MCU", "Pengajuan CoE", "Pengajuan Visa"].includes(c.progress)).length;
  const siapTerbang = candidates.filter((c) => c.progress === "Siap Terbang").length;
  const totalActiveJobs = jobs.filter((j) => j.status === "open").length;

  return (
    <Layout activeMenu="/matching-job">
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-20">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1700px] mx-auto space-y-6">

          {/* ================================================================ */}
          {/* HERO BANNER */}
          {/* ================================================================ */}
          <div className="relative w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-gradient-to-r from-[#0c2e59] via-[#164e87] to-[#1e3a8a] text-white p-6 sm:p-8 md:p-10 border border-blue-900/30 group transition-all duration-500">
            <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-blue-400/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-400/30 transition-all duration-700"></div>
            <div className="absolute right-1/4 top-0 w-64 h-64 bg-amber-400/15 rounded-full blur-[60px] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-black uppercase tracking-wider mb-4 border border-white/15 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
                  LPK CREATIVA • JOB MATCHING & PLACEMENT JAPAN
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-md leading-tight">
                  Matching Job <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">Management</span>
                </h1>
                <p className="text-blue-100/90 text-sm sm:text-base mt-3 leading-relaxed max-w-2xl font-medium">
                  Kelola asal lowongan job (TSK / LPK Mitra Jepang), LPK pengirim kandidat dari berbagai daerah, total rincian biaya matching job, serta fasilitas yang sudah include secara transparan dan otomatis.
                </p>
              </div>

              {/* Action Buttons inside Hero */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleOpenCreateJob}
                  id="btn-tambah-job-hero"
                  className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-md border border-white/25 shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <Briefcase className="w-4 h-4 text-amber-300" />
                  <span>+ Tambah Lowongan Job</span>
                </button>

                <button
                  onClick={() => handleOpenCreateCandidate()}
                  id="btn-tambah-kandidat-hero"
                  className="group/btn relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer border border-amber-300/50"
                >
                  <Plus className="w-5 h-5 stroke-[3] group-hover/btn:rotate-90 transition-transform duration-300" />
                  <span>Tambah Kandidat Baru</span>
                </button>
              </div>
            </div>

            {/* TAB SELECTOR BAR */}
            <div role="tablist" aria-label="Kategori Data Matching Job" className="relative z-10 mt-8 pt-6 border-t border-white/15 flex flex-wrap items-center gap-2">
              <button
                role="tab"
                id="tab-candidates"
                aria-selected={activeTab === "candidates"}
                aria-controls="panel-candidates"
                onClick={() => setActiveTab("candidates")}
                className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-xs transition-all ${
                  activeTab === "candidates"
                    ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Daftar Kandidat ({candidates.length})</span>
              </button>

              <button
                role="tab"
                id="tab-biaya"
                aria-selected={activeTab === "biaya_table"}
                aria-controls="panel-biaya"
                onClick={() => setActiveTab("biaya_table")}
                className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-xs transition-all ${
                  activeTab === "biaya_table"
                    ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Tabel Biaya Job & TSK ({jobs.length})</span>
              </button>

              <button
                role="tab"
                id="tab-jobs"
                aria-selected={activeTab === "jobs"}
                aria-controls="panel-jobs"
                onClick={() => setActiveTab("jobs")}
                className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-xs transition-all ${
                  activeTab === "jobs"
                    ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Lowongan Job Orders ({jobs.length})</span>
              </button>

              <button
                role="tab"
                id="tab-summary"
                aria-selected={activeTab === "summary"}
                aria-controls="panel-summary"
                onClick={() => setActiveTab("summary")}
                className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-xs transition-all ${
                  activeTab === "summary"
                    ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Rekapitulasi Asal Job & Biaya</span>
              </button>
            </div>
          </div>

          {/* ================================================================ */}
          {/* STATS KPI ROW */}
          {/* ================================================================ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            <div className="bg-white rounded-[1.75rem] p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Kandidat</p>
                  <h3 className="text-3xl font-black text-slate-800 mt-1">{totalKandidat}</h3>
                  <span className="text-[11px] font-semibold text-blue-600 mt-1 block">Dari berbagai LPK Pengirim</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[1.75rem] p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lowongan Job Aktif</p>
                  <h3 className="text-3xl font-black text-indigo-700 mt-1">{totalActiveJobs}</h3>
                  <span className="text-[11px] font-semibold text-indigo-500 mt-1 block">Dari TSK & LPK Rekanan</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[1.75rem] p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lolos & MCU/CoE</p>
                  <h3 className="text-3xl font-black text-emerald-700 mt-1">{lolosDanMcu}</h3>
                  <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">Menunggu visa/terbang</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[1.75rem] p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Siap Terbang</p>
                  <h3 className="text-3xl font-black text-amber-600 mt-1">{siapTerbang}</h3>
                  <span className="text-[11px] font-semibold text-amber-500 mt-1 block">Keberangkatan ke Jepang</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Plane className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* TAB CONTENT 1: DAFTAR KANDIDAT MATCHING JOB */}
          {/* ================================================================ */}
          {activeTab === "candidates" && (
            <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-lg overflow-hidden">
              {/* Toolbar Header */}
              <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#0c2e59]" />
                    Daftar Kandidat Matching Job
                  </h2>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    Menampilkan {filteredCandidates.length} dari {candidates.length} kandidat terdaftar beserta asal job & LPK pengirim
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search */}
                  <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama, LPK, job..."
                      className="w-full h-10 pl-9 pr-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#0c2e59]"
                    />
                  </div>

                  {/* Filter Progress */}
                  <select
                    value={filterProgress}
                    onChange={(e) => setFilterProgress(e.target.value)}
                    className="h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none"
                  >
                    <option value="Semua">Semua Progress</option>
                    {PROGRESS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Filter LPK Pengirim */}
                  <select
                    value={filterLpk}
                    onChange={(e) => setFilterLpk(e.target.value)}
                    className="h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none max-w-[180px] truncate"
                  >
                    {combinedLpkOptions.map((lpk) => (
                      <option key={lpk} value={lpk}>
                        {lpk === "Semua" ? "Semua LPK Pengirim" : lpk}
                      </option>
                    ))}
                  </select>

                  {/* Filter Job */}
                  <select
                    value={filterJob}
                    onChange={(e) => setFilterJob(e.target.value)}
                    className="h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none max-w-[180px] truncate"
                  >
                    <option value="Semua">Semua Job</option>
                    {jobs.map((jb) => (
                      <option key={jb.id} value={jb.id}>
                        {jb.job_title}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={fetchData}
                    disabled={isLoading}
                    title="Refresh Data"
                    aria-label="Segarkan data kandidat dan lowongan job"
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
                  </button>

                  <button
                    onClick={handleExportExcel}
                    className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export</span>
                  </button>

                  <button
                    onClick={() => handleOpenCreateCandidate()}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#0c2e59] hover:bg-[#143e74] text-white font-bold text-xs shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Kandidat</span>
                  </button>
                </div>
              </div>

              {/* TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1250px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-black tracking-wider">
                      <th className="py-4 px-4 w-12 text-center">NO</th>
                      <th className="py-4 px-3 w-16 text-center">FOTO</th>
                      <th className="py-4 px-5 min-w-[200px]">NAMA & KONTAK</th>
                      <th className="py-4 px-4 min-w-[160px]">LPK PENGIRIM</th>
                      <th className="py-4 px-5 min-w-[220px]">JOB & ASAL (TSK/LPK)</th>
                      <th className="py-4 px-4 min-w-[160px]">BIAYA & INCLUDE</th>
                      <th className="py-4 px-4 min-w-[140px] text-center">BERKAS</th>
                      <th className="py-4 px-4 min-w-[170px] text-center">PROGRESS</th>
                      <th className="py-4 px-4 w-24 text-center">AKSI</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
                    {isLoading ? (
                      <tr>
                        <td colSpan="9" className="py-16 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-7 h-7 border-2 border-slate-200 border-t-[#0c2e59] rounded-full animate-spin"></div>
                            <span className="text-xs font-bold text-slate-500">Memuat data kandidat matching job...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredCandidates.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-14 text-center">
                          <div className="max-w-md mx-auto flex flex-col items-center justify-center p-4">
                            <Briefcase className="w-10 h-10 text-slate-300 mb-2" />
                            <h4 className="text-sm font-black text-slate-700">Belum Ada Data Kandidat Sesuai Filter</h4>
                            <p className="text-xs text-slate-500 mt-1">
                              Silakan sesuaikan kata kunci atau tambahkan kandidat baru ke dalam sistem.
                            </p>
                            <button
                              onClick={() => handleOpenCreateCandidate()}
                              className="mt-3.5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0c2e59] text-white text-xs font-bold"
                            >
                              <Plus className="w-3.5 h-3.5" /> Tambah Kandidat Sekarang
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCandidates.map((cand, idx) => {
                        const meta = getProgressMeta(cand.progress);
                        const photoUrl = getFileUrl(cand.foto);
                        const cvUrl = getFileUrl(cand.file_cv);
                        const sswUrl = getFileUrl(cand.file_ssw);
                        const jftUrl = getFileUrl(cand.file_jft);

                        return (
                          <tr key={cand.id} className="hover:bg-blue-50/50 transition-colors">
                            {/* 1. NO */}
                            <td className="py-3.5 px-4 text-center font-bold text-slate-400">#{idx + 1}</td>

                            {/* 2. FOTO */}
                            <td className="py-3.5 px-3 text-center">
                              <div className="flex justify-center">
                                {photoUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => handlePreview(photoUrl, cand.foto)}
                                    className="w-11 h-11 rounded-xl overflow-hidden ring-1 ring-slate-200 hover:ring-[#0c2e59] transition shadow-xs"
                                  >
                                    <img src={photoUrl} alt={cand.nama_lengkap} className="w-full h-full object-cover" />
                                  </button>
                                ) : (
                                  <div className="w-11 h-11 rounded-xl bg-[#0c2e59] text-white flex items-center justify-center font-black text-xs shadow-xs">
                                    {cand.nama_lengkap?.slice(0, 2).toUpperCase() || "KD"}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* 3. NAMA & KONTAK */}
                            <td className="py-3.5 px-5">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-black text-slate-900 text-sm leading-tight hover:text-[#0c2e59]">
                                  {cand.nama_lengkap}
                                </span>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                  {cand.usia && <span className="font-bold text-slate-700">{cand.usia} Thn</span>}
                                  {cand.no_wa && (
                                    <a
                                      href={`https://wa.me/${cand.no_wa.replace(/[^0-9]/g, "")}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                                    >
                                      <Phone className="w-3 h-3" />
                                      {cand.no_wa}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* 4. LPK PENGIRIM */}
                            <td className="py-3.5 px-4">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-900 border border-blue-200/70 font-bold text-xs max-w-[190px]">
                                <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="truncate">{cand.lpk_pengirim || "Creativa / Mandiri"}</span>
                              </div>
                            </td>

                            {/* 5. JOB & ASAL JOB (TSK/LPK) */}
                            <td className="py-3.5 px-5">
                              {cand.job_title ? (
                                <div className="space-y-1 max-w-[240px]">
                                  <div className="font-black text-slate-800 text-xs truncate" title={cand.job_title}>
                                    {cand.job_title}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                                      {cand.source_type || "TSK"}
                                    </span>
                                    <span className="text-slate-600 font-medium truncate max-w-[160px]" title={cand.tsk_name || cand.source_name}>
                                      {cand.tsk_name || cand.source_name}
                                    </span>
                                  </div>
                                  {cand.lokasi_jepang && (
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                                      <MapPin className="w-3 h-3 text-rose-500" />
                                      {cand.lokasi_jepang}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="text-slate-600 font-bold text-xs">{cand.bidang || "Pool Kandidat"}</div>
                                  {cand.tsk_name ? (
                                    <div className="text-[10px] flex items-center gap-1 text-purple-800">
                                      <span className="px-1 py-0.2 rounded bg-purple-100 font-bold">TSK</span>
                                      <span className="font-medium truncate max-w-[150px]">{cand.tsk_name}</span>
                                    </div>
                                  ) : (
                                    <div className="text-slate-400 italic text-xs">Belum ada Job / TSK</div>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* 6. BIAYA MATCHING & FASILITAS */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <span className="font-black text-emerald-700 text-xs block">
                                  {formatRupiah(cand.biaya_matching_efektif || cand.total_biaya || 0)}
                                </span>
                                {Array.isArray(cand.effective_includes) && cand.effective_includes.length > 0 ? (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200/80 cursor-help"
                                    title={cand.effective_includes.join("\n• ")}
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    {cand.effective_includes.length} Fasilitas Include
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400">Standard Program</span>
                                )}
                              </div>
                            </td>

                            {/* 7. BERKAS DOKUMEN */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {cvUrl ? (
                                  <a
                                    href={cvUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold hover:bg-emerald-100"
                                    title="Lihat Berkas CV"
                                  >
                                    CV ✓
                                  </a>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px]">CV -</span>
                                )}

                                {jftUrl ? (
                                  <a
                                    href={jftUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold hover:bg-purple-100"
                                    title="Sertifikat JFT"
                                  >
                                    JFT ✓
                                  </a>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px]">JFT -</span>
                                )}

                                {sswUrl ? (
                                  <a
                                    href={sswUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold hover:bg-blue-100"
                                    title="Sertifikat SSW"
                                  >
                                    SSW ✓
                                  </a>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px]">SSW -</span>
                                )}
                              </div>
                            </td>

                            {/* 8. PROGRESS STATUS */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="relative inline-block text-left">
                                <select
                                  value={cand.progress || "Pendaftaran"}
                                  onChange={(e) => handleQuickStatusChange(cand.id, e.target.value)}
                                  className={`appearance-none cursor-pointer pl-6 pr-6 py-1.5 rounded-xl text-xs font-black border ${meta.bg} ${meta.text} ${meta.border} outline-none`}
                                >
                                  {PROGRESS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value} className="bg-white text-slate-800 font-bold">
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                                <div className={`w-2 h-2 rounded-full absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${meta.dot}`}></div>
                                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                              </div>
                            </td>

                            {/* 9. AKSI */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenCandidateDetail(cand)}
                                  title="Detail Dossier Lengkap"
                                  aria-label={`Lihat detail dossier lengkap ${cand.nama_lengkap}`}
                                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 flex items-center justify-center transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditCandidate(cand)}
                                  title="Edit Data"
                                  aria-label={`Edit data kandidat ${cand.nama_lengkap}`}
                                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-600 flex items-center justify-center transition cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleQuickStatusChange(cand.id, "Gagal / Batal")}
                                  title="Arsipkan / Batal"
                                  aria-label={`Arsipkan atau batalkan kandidat ${cand.nama_lengkap}`}
                                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB CONTENT: TABEL BIAYA JOB & TSK JEPANG */}
          {/* ================================================================ */}
          {activeTab === "biaya_table" && (
            <div className="space-y-6">
              {/* Header & Filter Card */}
              <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-slate-200/80 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-black uppercase tracking-wider mb-2">
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    Transparansi Biaya & Lembaga Penyalur
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Tabel Biaya Matching Job & TSK Jepang
                  </h2>
                  <p className="text-xs md:text-sm font-medium text-slate-500 mt-1">
                    Daftar lengkap komparasi biaya penempatan program kerja Jepang (Tokutei Ginou / SSW), rincian lembaga TSK (登録支援機関), estimasi gaji, serta breakdown fasilitas include & exclude.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchBiaya}
                      onChange={(e) => setSearchBiaya(e.target.value)}
                      placeholder="Cari job, TSK, prefektur..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0c2e59] text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition"
                    />
                    {searchBiaya && (
                      <button
                        onClick={() => setSearchBiaya("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Bidang */}
                  <div className="relative min-w-[190px]">
                    <select
                      value={filterBiayaBidang}
                      onChange={(e) => setFilterBiayaBidang(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-700 outline-none transition cursor-pointer"
                    >
                      <option value="Semua">Semua Bidang SSW</option>
                      {BIDANG_OPTIONS.map((bd) => (
                        <option key={bd} value={bd}>
                          {bd}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Refresh */}
                  <button
                    onClick={fetchData}
                    disabled={isLoading}
                    title="Refresh Data"
                    aria-label="Segarkan data biaya job"
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer transition"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
                  </button>

                  {/* Tambah Kandidat */}
                  <button
                    onClick={() => handleOpenCreateCandidate()}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#0c2e59] hover:bg-[#143e74] text-white font-bold text-xs shadow-sm cursor-pointer transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Daftarkan Kandidat</span>
                  </button>
                </div>
              </div>

              {/* KPI CARDS BIAYA */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Job Jepang</span>
                    <span className="text-2xl font-black text-slate-900 mt-0.5 block">{jobs.length} Posisi</span>
                    <span className="text-[11px] text-blue-600 font-bold block">{totalKuotaJobs} Kuota Dibuka</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Rata-Rata Biaya Job</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 block">{formatRupiah(avgBiaya)}</span>
                    <span className="text-[11px] text-slate-500 font-semibold block">Termasuk CoE & Visa</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Coins className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Kisaran Biaya</span>
                    <span className="text-base sm:text-lg font-black text-slate-800 mt-0.5 block truncate max-w-[180px]">
                      {minBiaya > 0 ? `${(minBiaya / 1000000).toFixed(0)} Jt - ${(maxBiaya / 1000000).toFixed(0)} Jt` : "-"}
                    </span>
                    <span className="text-[11px] text-indigo-600 font-bold block">Tergantung Bidang & TSK</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Mitra Lembaga TSK</span>
                    <span className="text-2xl font-black text-purple-700 mt-0.5 block">{uniqueTskCount} Lembaga</span>
                    <span className="text-[11px] text-purple-500 font-semibold block">Terverifikasi Jepang</span>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* TABLE CONTAINER */}
              <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1300px]">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-black tracking-wider">
                        <th className="py-4 px-3 w-12 text-center">NO</th>
                        <th className="py-4 px-4 min-w-[220px]">LOWONGAN KERJA & BIDANG</th>
                        <th className="py-4 px-4 min-w-[220px]">ASAL LEMBAGA TSK JEPANG</th>
                        <th className="py-4 px-4 min-w-[180px]">LOKASI JEPANG & GAJI</th>
                        <th className="py-4 px-4 min-w-[170px]">TOTAL BIAYA JOB</th>
                        <th className="py-4 px-4 min-w-[280px]">FASILITAS INCLUDE</th>
                        <th className="py-4 px-4 min-w-[180px]">BIAYA EXCLUDE</th>
                        <th className="py-4 px-3 min-w-[110px] text-center">KUOTA</th>
                        <th className="py-4 px-4 min-w-[140px] text-center">AKSI DAFTAR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredBiayaJobs.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="py-16 text-center">
                            <Coins className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <h4 className="text-base font-bold text-slate-700">Tidak ada data lowongan / biaya</h4>
                            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                              Tidak ditemukan data biaya job dengan filter pencarian saat ini. Silakan ubah filter atau kata kunci.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filteredBiayaJobs.map((job, idx) => {
                          const candidateCount = candidates.filter((c) => String(c.job_id) === String(job.id)).length;
                          const includes = Array.isArray(job.include_items_array) ? job.include_items_array : [];
                          const totalFee = Number(job.total_biaya) || 0;

                          return (
                            <tr key={job.id} className="hover:bg-blue-50/30 transition-colors">
                              {/* NO */}
                              <td className="py-4 px-3 text-center font-bold text-slate-400">
                                {idx + 1}
                              </td>

                              {/* LOWONGAN & BIDANG */}
                              <td className="py-4 px-4">
                                <div className="space-y-1">
                                  <div className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                                    <Briefcase className="w-4 h-4 text-blue-700 flex-shrink-0" />
                                    <span>{job.job_title}</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black">
                                      {job.bidang || "SSW"}
                                    </span>
                                    {job.status === "open" ? (
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                        Open
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                                        Closed
                                      </span>
                                    )}
                                  </div>
                                  {job.persyaratan && (
                                    <p className="text-[11px] text-slate-500 line-clamp-1 italic" title={job.persyaratan}>
                                      Syarat: {job.persyaratan}
                                    </p>
                                  )}
                                </div>
                              </td>

                              {/* LEMBAGA TSK JEPANG */}
                              <td className="py-4 px-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-black">
                                      {job.source_type || "TSK"}
                                    </span>
                                    <span className="font-black text-purple-950 text-xs">
                                      {job.source_name || "TSK / Lembaga Rekanan"}
                                    </span>
                                  </div>
                                  {job.source_pic && (
                                    <div className="text-[11px] text-slate-600 flex items-center gap-1">
                                      <span className="text-slate-400 font-bold">PIC:</span> {job.source_pic}
                                    </div>
                                  )}
                                  {job.source_contact && (
                                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-emerald-600" />
                                      <span>{job.source_contact}</span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* LOKASI JEPANG & GAJI */}
                              <td className="py-4 px-4">
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-800 flex items-center gap-1 text-xs">
                                    <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                                    <span>{job.lokasi_jepang || "Jepang"}</span>
                                  </div>
                                  <div className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/80 inline-block">
                                    {job.estimasi_gaji || "¥190,000 - ¥230,000"}
                                  </div>
                                </div>
                              </td>

                              {/* TOTAL BIAYA JOB */}
                              <td className="py-4 px-4">
                                <div className="space-y-1">
                                  <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                                    <Coins className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                    <span className="font-black text-emerald-800 text-sm">
                                      {formatRupiah(totalFee)}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-bold">
                                    Mata Uang: {job.currency || "IDR"} (Transparan)
                                  </div>
                                </div>
                              </td>

                              {/* FASILITAS INCLUDE */}
                              <td className="py-4 px-4">
                                <div className="space-y-1.5 max-w-[340px]">
                                  {includes.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {includes.slice(0, 4).map((inc, i) => (
                                        <span
                                          key={i}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 text-[10px] font-bold border border-emerald-200/80"
                                        >
                                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 flex-shrink-0" />
                                          <span className="truncate max-w-[130px]">{inc}</span>
                                        </span>
                                      ))}
                                      {includes.length > 4 && (
                                        <span
                                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black cursor-help"
                                          title={includes.slice(4).join("\n• ")}
                                        >
                                          +{includes.length - 4} Lainnya
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-slate-400 italic">Standard Program Termasuk</span>
                                  )}
                                </div>
                              </td>

                              {/* BIAYA EXCLUDE */}
                              <td className="py-4 px-4">
                                <div className="text-[11px] text-slate-600 max-w-[200px] line-clamp-2" title={job.exclude_items}>
                                  {job.exclude_items || "Biaya paspor mandiri & uang saku pribadi"}
                                </div>
                              </td>

                              {/* KUOTA */}
                              <td className="py-4 px-3 text-center">
                                <div className="space-y-0.5">
                                  <span className="text-xs font-black text-slate-800 block">
                                    {job.kuota || 1} Orang
                                  </span>
                                  <span className="text-[10px] font-bold text-blue-600 block">
                                    {candidateCount} Pelamar
                                  </span>
                                </div>
                              </td>

                              {/* AKSI DAFTAR */}
                              <td className="py-4 px-4 text-center">
                                <div className="flex flex-col gap-1.5 items-center justify-center">
                                  <button
                                    onClick={() => handleOpenCreateCandidate(job.id)}
                                    className="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-[#0c2e59] hover:bg-[#143e74] text-white font-black text-xs shadow-sm transition cursor-pointer"
                                    title="Daftarkan kandidat ke lowongan job ini"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Daftarkan</span>
                                  </button>

                                  <button
                                    onClick={() => handleOpenEditJob(job)}
                                    className="w-full inline-flex items-center justify-center gap-1 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer"
                                    title="Edit rincian biaya atau informasi job ini"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Rincian</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-2">
                  <span>
                    Menampilkan <strong className="text-slate-800">{filteredBiayaJobs.length}</strong> dari <strong className="text-slate-800">{jobs.length}</strong> lowongan kerja Jepang
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Biaya Resmi & Terbuka
                    </span>
                    <span>•</span>
                    <span className="text-slate-600">Terhubung langsung dengan Lembaga TSK Jepang</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB CONTENT 2: LOWONGAN JOB ORDERS (KELOLA ASAL JOB & BIAYA) */}
          {/* ================================================================ */}
          {activeTab === "jobs" && (
            <div className="space-y-6">
              {/* Toolbar Lowongan Job */}
              <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#0c2e59]" />
                    Katalog Lowongan Job (Job Orders)
                  </h2>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    Daftar posisi lowongan kerja ke Jepang dari TSK (登録支援機関), LPK Rekanan, dan Perusahaan Jepang
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari lowongan / TSK / lokasi..."
                      className="w-full h-10 pl-9 pr-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#0c2e59]"
                    />
                  </div>

                  {/* Filter Tipe Asal */}
                  <select
                    value={filterJobSource}
                    onChange={(e) => setFilterJobSource(e.target.value)}
                    className="h-10 px-3 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none"
                  >
                    <option value="Semua">Semua Asal (TSK/LPK)</option>
                    <option value="TSK">TSK Jepang</option>
                    <option value="LPK Mitra">LPK Mitra</option>
                    <option value="Kumiai">Kumiai / AO</option>
                    <option value="Perusahaan">Perusahaan Langsung</option>
                  </select>

                  <button
                    onClick={handleOpenCreateJob}
                    id="btn-tambah-job-card"
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-[#0c2e59] to-[#14427b] text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Lowongan Job</span>
                  </button>
                </div>
              </div>

              {/* Grid Cards of Jobs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {isLoading ? (
                  <div className="col-span-full py-16 text-center text-slate-400">
                    <div className="w-7 h-7 border-2 border-slate-200 border-t-[#0c2e59] rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="text-xs font-bold">Memuat daftar lowongan pekerjaan...</span>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200">
                    <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-base font-black text-slate-800">Belum Ada Lowongan Job</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Silakan klik tombol di bawah untuk menambahkan lowongan job dari TSK atau LPK mitra.
                    </p>
                    <button
                      onClick={handleOpenCreateJob}
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0c2e59] text-white font-bold text-xs"
                    >
                      <Plus className="w-4 h-4" /> Buat Lowongan Baru
                    </button>
                  </div>
                ) : (
                  filteredJobs.map((job) => {
                    const includeList = Array.isArray(job.include_items_array) ? job.include_items_array : [];
                    const sourceObj = SOURCE_TYPES.find((s) => s.value === job.source_type) || SOURCE_TYPES[0];

                    return (
                      <div
                        key={job.id}
                        className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                      >
                        {/* Top Header Card */}
                        <div className="p-5 md:p-6 space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${sourceObj.bg}`}>
                              {job.source_type} • {job.source_name}
                            </span>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                job.status === "open"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : job.status === "fulfilled"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {job.status === "open" ? "Buka / Aktif" : job.status === "fulfilled" ? "Terpenuhi" : "Ditutup"}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-black text-slate-900 group-hover:text-[#0c2e59] transition leading-snug">
                              {job.job_title}
                            </h3>
                            <span className="text-xs font-bold text-blue-600 block mt-0.5">{job.bidang}</span>
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="font-semibold">{job.lokasi_jepang}</span>
                            </div>
                            {job.estimasi_gaji && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="font-bold text-slate-700">{job.estimasi_gaji}</span>
                              </div>
                            )}
                          </div>

                          {/* TOTAL BIAYA MATCHING JOB */}
                          <div className="bg-gradient-to-r from-blue-50/80 to-slate-50 p-3.5 rounded-2xl border border-blue-100 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                              <span>Total Biaya Matching Job:</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-black text-slate-600 border border-slate-200">
                                {job.currency || "IDR"}
                              </span>
                            </div>
                            <div className="text-lg font-black text-slate-900">
                              {formatRupiah(job.total_biaya)}
                            </div>
                          </div>

                          {/* INCLUDE APA SAJA CHECKLIST PILLS */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                              Include Apa Saja ({includeList.length} Fasilitas):
                            </span>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-hidden">
                              {includeList.slice(0, 4).map((inc, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200"
                                >
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  <span className="truncate max-w-[170px]">{inc}</span>
                                </span>
                              ))}
                              {includeList.length > 4 && (
                                <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                                  +{includeList.length - 4} lainnya
                                </span>
                              )}
                            </div>
                          </div>

                          {/* LPK PENGIRIM & KANDIDAT YANG MELAMAR */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-500 text-[11px]">Kandidat Melamar:</span>
                              <span className="font-black text-blue-700">
                                {job.total_kandidat || 0} / {job.kuota || 1} Kuota
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-600 truncate">
                              <b>LPK Pengirim:</b>{" "}
                              {job.lpk_pengirim_list || "Belum ada kandidat terdaftar"}
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleOpenJobDetail(job)}
                            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Detail Lengkap
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenCreateCandidate(job.id)}
                              title="Daftarkan Kandidat ke Job Ini"
                              className="px-2.5 py-1.5 rounded-lg bg-[#0c2e59] hover:bg-[#153f75] text-white text-[11px] font-bold flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Tambah Kandidat
                            </button>

                            <button
                              onClick={() => handleOpenEditJob(job)}
                              title="Edit Lowongan"
                              aria-label={`Edit data lowongan ${job.job_title}`}
                              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteJob(job)}
                              title="Hapus / Tutup Lowongan"
                              aria-label={`Hapus atau tutup lowongan ${job.job_title}`}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB CONTENT 3: REKAPITULASI & MONITORING ASAL JOB & BIAYA */}
          {/* ================================================================ */}
          {activeTab === "summary" && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase">Distribusi LPK Pengirim</h4>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">
                      {allLpksFromData.length || 1} Mitra LPK
                    </p>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    {allLpksFromData.length === 0 ? (
                      <p className="text-slate-500 italic">Belum ada variasi LPK pengirim</p>
                    ) : (
                      allLpksFromData.map((lpkName, i) => {
                        const count = candidates.filter((c) => c.lpk_pengirim === lpkName).length;
                        return (
                          <div key={i} className="flex items-center justify-between text-slate-700 font-semibold">
                            <span className="truncate max-w-[200px]">{lpkName}</span>
                            <span className="font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px]">
                              {count} orang
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase">Biaya Matching Job Rata-Rata</h4>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">
                      {formatRupiah(
                        jobs.length > 0
                          ? jobs.reduce((acc, curr) => acc + (parseFloat(curr.total_biaya) || 0), 0) / jobs.length
                          : 25000000
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    Nilai estimasi paket biaya matching job mencakup pengurusan visa/CoE, pelatihan mensaetsu, dan penjemputan di Jepang.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase">Fasilitas Paling Populer</h4>
                    <p className="text-2xl font-black text-slate-800 mt-0.5">100% Include Visa & CoE</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Setiap kandidat yang terhubung ke job order secara otomatis mendapatkan checklist fasilitas yang terverifikasi transparan antara LPK pengirim, kandidat, dan TSK Jepang.
                  </p>
                </div>
              </div>

              {/* Table of Jobs & Candidate Sending LPKs */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
                <h3 className="text-base font-black text-slate-900">Rekapitulasi Job & LPK Pengirim Terdaftar</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black">
                        <th className="py-3 px-4">Nama Job Lowongan</th>
                        <th className="py-3 px-4">Asal Job (TSK/LPK)</th>
                        <th className="py-3 px-4">Total Biaya Job</th>
                        <th className="py-3 px-4">LPK Pengirim Kandidat</th>
                        <th className="py-3 px-4 text-center">Jumlah Kandidat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{job.job_title}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 text-[10px] font-bold border border-purple-200">
                              {job.source_type}
                            </span>{" "}
                            {job.source_name}
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-700">{formatRupiah(job.total_biaya)}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {job.lpk_pengirim_list || <span className="text-slate-400 italic">Belum ada</span>}
                          </td>
                          <td className="py-3 px-4 text-center font-black text-blue-700">
                            {job.total_kandidat || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ================================================================ */}
        {/* MODAL: TAMBAH / EDIT LOWONGAN JOB (JOB ORDER) */}
        {/* ================================================================ */}
        {isJobModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden my-8 max-h-[90vh] flex flex-col">
              
              {/* Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-[#0c2e59] via-[#164e87] to-[#1e3a8a] text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">
                      {jobModalMode === "edit" ? "Edit Lowongan Job (Job Order)" : "Tambah Lowongan Job Baru"}
                    </h3>
                    <p className="text-xs text-blue-100 font-medium">
                      Tentukan asal job (TSK/LPK), total biaya matching, dan rincian fasilitas yang include
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsJobModalOpen(false)}
                  aria-label="Tutup form lowongan job"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitJob} className="overflow-y-auto p-6 md:p-8 space-y-6">
                
                {/* 1. ASAL JOB (DARI TSK MANA / DARI LPK MANA) */}
                <div className="bg-purple-50/60 p-5 rounded-2xl border border-purple-200/80 space-y-4">
                  <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2 border-b border-purple-200/60 pb-2">
                    <Building2 className="w-4 h-4 text-purple-700" />
                    1. Asal Lowongan Job (TSK / LPK Mitra Jepang)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tipe Lembaga */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        Tipe Asal Job <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={jobSourceType}
                        onChange={(e) => setJobSourceType(e.target.value)}
                        className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-purple-200 rounded-xl outline-none focus:border-[#0c2e59]"
                      >
                        {SOURCE_TYPES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Nama Lembaga */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        Nama TSK / LPK Asal Job <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={jobSourceName}
                        onChange={(e) => setJobSourceName(e.target.value)}
                        placeholder="Contoh: TSK Zenkoku Care Support Japan"
                        className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-purple-200 rounded-xl outline-none focus:border-[#0c2e59]"
                      />
                    </div>

                    {/* PIC Lembaga */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        Nama PIC Lembaga (Opsional)
                      </label>
                      <input
                        type="text"
                        value={jobSourcePic}
                        onChange={(e) => setJobSourcePic(e.target.value)}
                        placeholder="Contoh: Yamada Kenichi (PIC Tokyo)"
                        className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none"
                      />
                    </div>

                    {/* Kontak PIC */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        Kontak / No WA PIC (Opsional)
                      </label>
                      <input
                        type="text"
                        value={jobSourceContact}
                        onChange={(e) => setJobSourceContact(e.target.value)}
                        placeholder="Contoh: +81 80-1234-5678"
                        className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. DETAIL PEKERJAAN & LOKASI */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/60 pb-2">
                    <Briefcase className="w-4 h-4 text-[#0c2e59]" />
                    2. Detail Posisi Pekerjaan & Penempatan
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Judul Posisi */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        Nama / Posisi Pekerjaan <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Contoh: Kaigo Caregiver (Perawat Lansia) Shizuoka"
                        className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0c2e59]"
                      />
                    </div>

                    {/* Bidang SSW */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        Bidang Pekerjaan (SSW)
                      </label>
                      <select
                        value={jobBidang}
                        onChange={(e) => setJobBidang(e.target.value)}
                        className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none"
                      >
                        {BIDANG_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Lokasi Jepang */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        Lokasi Penempatan Kerja di Jepang <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={jobLokasiJepang}
                        onChange={(e) => setJobLokasiJepang(e.target.value)}
                        placeholder="Contoh: Shizuoka-ken / Tokyo-to"
                        className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none"
                      />
                    </div>

                    {/* Kuota */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        Kuota / Kebutuhan Orang
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={jobKuota}
                        onChange={(e) => setJobKuota(e.target.value)}
                        className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none"
                      />
                    </div>

                    {/* Estimasi Gaji */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        Estimasi Gaji Pokok (Take Home Pay)
                      </label>
                      <input
                        type="text"
                        value={jobEstimasiGaji}
                        onChange={(e) => setJobEstimasiGaji(e.target.value)}
                        placeholder="Contoh: ¥195,000 - ¥230,000 / bulan"
                        className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. TOTAL BIAYA MATCHING JOB & RINCIAN FASILITAS INCLUDE */}
                <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200/80 space-y-4">
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-200/60 pb-2">
                    <Coins className="w-4 h-4 text-emerald-700" />
                    3. Total Biaya Matching Job & Rincian Fasilitas Include
                  </h4>

                  {/* Nominal Biaya */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        Total Biaya Matching Job (Nominal) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">
                          Rp
                        </span>
                        <input
                          type="number"
                          required
                          value={jobTotalBiaya}
                          onChange={(e) => setJobTotalBiaya(e.target.value)}
                          placeholder="25000000"
                          className="w-full h-11 pl-10 pr-4 text-xs font-black bg-white border border-emerald-300 rounded-xl outline-none focus:border-emerald-600"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
                        Terbaca: {formatRupiah(parseFloat(jobTotalBiaya) || 0)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">
                        Mata Uang
                      </label>
                      <select
                        value={jobCurrency}
                        onChange={(e) => setJobCurrency(e.target.value)}
                        className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none"
                      >
                        <option value="IDR">IDR (Rupiah)</option>
                        <option value="JPY">JPY (Yen Jepang)</option>
                      </select>
                    </div>
                  </div>

                  {/* Checklist Include Apa Saja */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-2">
                      Pilih Fasilitas & Layanan yang INCLUDE dalam Biaya Tersebut:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 bg-white/80 rounded-xl border border-emerald-100">
                      {PRESET_INCLUDES.map((item, idx) => {
                        const isChecked = jobIncludeItems.includes(item);
                        return (
                          <div
                            key={idx}
                            onClick={() => handleToggleIncludeItem(item)}
                            className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition select-none ${
                              isChecked
                                ? "bg-emerald-50 text-emerald-950 border-emerald-300 font-bold"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 text-xs"
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="text-xs leading-tight">{item}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tambah Include Kustom */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customIncludeInput}
                      onChange={(e) => setCustomIncludeInput(e.target.value)}
                      placeholder="+ Tambah fasilitas include lainnya (misal: Subsidi Akomodasi ¥20,000)"
                      className="flex-1 h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomInclude}
                      className="px-4 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      + Tambah
                    </button>
                  </div>

                  {/* Exclude Catatan */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      Biaya Tidak Termasuk (Exclude)
                    </label>
                    <input
                      type="text"
                      value={jobExcludeItems}
                      onChange={(e) => setJobExcludeItems(e.target.value)}
                      placeholder="Contoh: Paspor mandiri, uang saku awal pribadi"
                      className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                </div>

                {/* 4. PERSYARATAN & STATUS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">
                      Persyaratan & Kualifikasi
                    </label>
                    <textarea
                      rows="2"
                      value={jobPersyaratan}
                      onChange={(e) => setJobPersyaratan(e.target.value)}
                      placeholder="Contoh: Sertifikat SSW, JFT A2/JLPT N4..."
                      className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">
                      Status Lowongan Job
                    </label>
                    <select
                      value={jobStatus}
                      onChange={(e) => setJobStatus(e.target.value)}
                      className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none"
                    >
                      <option value="open">Buka / Aktif Menerima Kandidat</option>
                      <option value="interview">Tahap Interview User</option>
                      <option value="fulfilled">Kuota Terpenuhi</option>
                      <option value="closed">Ditutup</option>
                    </select>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsJobModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-7 py-3 rounded-xl bg-[#0c2e59] hover:bg-[#143e74] text-white text-xs font-black shadow-md transition disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Menyimpan Lowongan...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{jobModalMode === "edit" ? "Simpan Perubahan Lowongan" : "Simpan Lowongan Job"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* MODAL: TAMBAH / EDIT KANDIDAT & LINK KE LOWONGAN JOB */}
        {/* ================================================================ */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden my-8 max-h-[90vh] flex flex-col">
              
              {/* Header Modal */}
              <div className="px-6 py-5 bg-gradient-to-r from-[#0c2e59] via-[#164e87] to-[#1e3a8a] text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">
                      {modalMode === "edit" ? "Edit Data Kandidat" : "Formulir Tambah Kandidat Matching"}
                    </h3>
                    <p className="text-xs text-blue-100 font-medium">
                      Pilih lowongan job yang dilamar, LPK pengirim kandidat, dan berkas sertifikat
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Tutup formulir pendaftaran kandidat"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitCandidate} className="overflow-y-auto p-6 md:p-8 space-y-6">
                
                {/* 1. LOWONGAN JOB JEPANG, LEMBAGA TSK & LPK PENGIRIM */}
                <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/70 p-5 rounded-2xl border border-blue-200/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                    <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-700" />
                      1. Lowongan Job Jepang, Lembaga TSK & LPK Pengirim
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Tersedia {jobs.length} Lowongan Job Jepang
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1.1 Dropdown Semua Job Jepang (KAIGO, PENGOLAHAN MAKANAN, PERTANIAN, PETERNAKAN, DLL) */}
                    <div className="md:col-span-2 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <Plane className="w-3.5 h-3.5 text-blue-600" />
                          Pilih Bidang / Lowongan Job Jepang (KAIGO, PENGOLAHAN MAKANAN, PERTANIAN, PETERNAKAN, DLL) <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                          {jobs.length > 0 ? `${jobs.length} Posisi TSK Aktif` : "14 Bidang Kerja Jepang"}
                        </span>
                      </div>

                      {/* Quick Sector Shortcut Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Pilih Cepat:</span>
                        {[
                          { key: "KAIGO", name: "🏥 KAIGO" },
                          { key: "PENGOLAHAN_MAKANAN", name: "🍱 PENGOLAHAN MAKANAN" },
                          { key: "PERTANIAN", name: "🌾 PERTANIAN" },
                          { key: "PETERNAKAN", name: "🐄 PETERNAKAN" },
                          { key: "KONSTRUKSI", name: "🏗️ KONSTRUKSI" },
                          { key: "MANUFAKTUR_MESIN", name: "⚙️ MANUFAKTUR" },
                          { key: "RESTORAN", name: "🍜 RESTORAN" },
                          { key: "OTOMOTIF", name: "🚗 OTOMOTIF" }
                        ].map((btn) => (
                          <button
                            key={btn.key}
                            type="button"
                            onClick={() => handleJobSelectChange(`sector:${btn.key}`)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                              selectedJobId === `sector:${btn.key}`
                                ? "bg-[#0c2e59] text-white shadow-xs"
                                : "bg-white hover:bg-blue-100 text-blue-900 border border-blue-200"
                            }`}
                          >
                            {btn.name}
                          </button>
                        ))}
                      </div>

                      {/* The Main Select Dropdown */}
                      <select
                        value={selectedJobId}
                        onChange={(e) => handleJobSelectChange(e.target.value)}
                        className="w-full h-12 px-3.5 text-xs font-bold bg-white border border-blue-200 rounded-xl outline-none focus:border-[#0c2e59] shadow-xs cursor-pointer"
                      >
                        <option value="">-- Pilih Bidang / Lowongan Kerja Jepang (KAIGO, PENGOLAHAN MAKANAN, PERTANIAN, PETERNAKAN, DLL) --</option>

                        <optgroup label="🇯🇵 BIDANG KERJA JEPANG UTAMA (TOKUTEI GINOU & MAGANG)">
                          {JAPAN_JOB_SECTORS.map((sec) => (
                            <option key={sec.key} value={`sector:${sec.key}`}>
                              {sec.icon} {sec.label} • Estimasi: {formatRupiah(sec.defaultBiaya)}
                            </option>
                          ))}
                        </optgroup>

                        {jobs.length > 0 && (
                          <optgroup label={`📋 POSISI LOWONGAN SPESIFIK DARI LEMBAGA TSK (${jobs.length} Posisi)`}>
                            {jobs.map((jb) => (
                              <option key={jb.id} value={jb.id}>
                                🇯🇵 {jb.job_title} • [{jb.bidang}] • TSK: {jb.source_name} • {formatRupiah(jb.total_biaya)} ({jb.lokasi_jepang || "Jepang"})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      <span className="text-[10px] text-slate-500 block">
                        Memilih job di atas otomatis melengkapi Bidang SSW, Lembaga TSK Jepang, dan Estimasi Biaya Job.
                      </span>
                    </div>

                    {/* 1.2 Form TSK (Bisa Diisi Sendiri atau Ketik) */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-purple-600" />
                          Lembaga TSK Jepang (登録支援機関)
                        </span>
                        <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                          Bisa Ketik Sendiri
                        </span>
                      </label>
                      <input
                        type="text"
                        list="tsk-suggestions"
                        value={tskName}
                        onChange={(e) => setTskName(e.target.value)}
                        placeholder="Contoh: TSK Zenkoku Care Support Japan / Ketik TSK"
                        className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-purple-200 rounded-xl outline-none focus:border-[#0c2e59]"
                      />
                      <datalist id="tsk-suggestions">
                        {Array.from(new Set(jobs.map((j) => j.source_name).filter(Boolean))).map((tsk, i) => (
                          <option key={i} value={tsk} />
                        ))}
                      </datalist>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Ketik nama TSK Jepang baru atau pilih dari saran di atas.
                      </span>
                    </div>

                    {/* 1.3 LPK Pengirim Kandidat (DROPDOWN DENGAN 8+ LPK) */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          LPK Pengirim Kandidat <span className="text-rose-500">*</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Dropdown Mitra
                        </span>
                      </label>
                      <select
                        value={isCustomLpk ? "__custom__" : lpkPengirim}
                        onChange={(e) => {
                          if (e.target.value === "__custom__") {
                            setIsCustomLpk(true);
                            setLpkPengirim("");
                          } else {
                            setIsCustomLpk(false);
                            setLpkPengirim(e.target.value);
                            setCustomLpk("");
                          }
                        }}
                        className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-emerald-200 rounded-xl outline-none focus:border-[#0c2e59] cursor-pointer"
                      >
                        {DEFAULT_LPK_PENGIRIM.map((lpk) => (
                          <option key={lpk} value={lpk}>
                            🏛️ {lpk}
                          </option>
                        ))}
                        {allLpksFromData
                          .filter((l) => !DEFAULT_LPK_PENGIRIM.includes(l))
                          .map((lpk) => (
                            <option key={lpk} value={lpk}>
                              🏛️ {lpk}
                            </option>
                          ))}
                        <option value="__custom__">➕ Ketik Nama LPK Lainnya...</option>
                      </select>

                      {/* Input manual if custom selected */}
                      {isCustomLpk && (
                        <div className="mt-2 animate-fadeIn">
                          <input
                            type="text"
                            required
                            value={customLpk}
                            onChange={(e) => {
                              setCustomLpk(e.target.value);
                              setLpkPengirim(e.target.value);
                            }}
                            placeholder="Ketik nama LPK pengirim baru di sini..."
                            className="w-full h-10 px-3.5 text-xs font-bold bg-white border-2 border-indigo-300 rounded-xl outline-none focus:border-indigo-600"
                            autoFocus
                          />
                        </div>
                      )}
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Pilih LPK asal pengirim kandidat dari daftar mitra resmi atau ketik manual.
                      </span>
                    </div>

                    {/* Preview Job Details if Selected */}
                    {selectedJobId && (() => {
                      const selJob = jobs.find((j) => String(j.id) === String(selectedJobId));
                      if (!selJob) return null;
                      return (
                        <div className="md:col-span-2 p-3.5 rounded-xl bg-white border border-blue-200 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-800">
                              {selJob.job_title} ({selJob.lokasi_jepang})
                            </span>
                            <span className="font-black text-emerald-700">
                              Total Biaya: {formatRupiah(selJob.total_biaya)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            <b>Asal:</b> [{selJob.source_type}] {selJob.source_name} | <b>Gaji:</b> {selJob.estimasi_gaji || "-"}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* TABEL RINCIAN BIAYA MATCHING JOB & FASILITAS INCLUDE */}
                <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-2">
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                      <Coins className="w-4 h-4 text-emerald-700" />
                      Tabel Rincian Biaya Matching Job & Fasilitas Include
                    </h4>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      Tabel Biaya Job
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Input Total Biaya */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center justify-between">
                        <span>Total Biaya Matching Job (Rp) <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-emerald-700 font-bold">Bisa diedit / disesuaikan</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">
                          Rp
                        </span>
                        <input
                          type="number"
                          value={biayaMatchingCandidate}
                          onChange={(e) => setBiayaMatchingCandidate(e.target.value)}
                          placeholder="Contoh: 25000000"
                          className="w-full h-11 pl-10 pr-4 text-xs font-black bg-white border border-emerald-300 rounded-xl outline-none focus:border-emerald-600 shadow-xs"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5">
                        <span className="text-[11px] font-bold text-emerald-800">
                          Terbaca: {formatRupiah(parseFloat(biayaMatchingCandidate) || 0)}
                        </span>
                        {/* Quick nominal buttons */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-bold">Preset:</span>
                          {[20000000, 22000000, 24000000, 25000000].map((nom) => (
                            <button
                              key={nom}
                              type="button"
                              onClick={() => setBiayaMatchingCandidate(nom)}
                              className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition"
                            >
                              {nom / 1000000} Jt
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Info Card */}
                    <div className="p-3.5 rounded-xl bg-white border border-emerald-200 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Mata Uang & Fasilitas</span>
                      <p className="font-black text-slate-800">IDR (Rupiah Indonesia)</p>
                      <p className="text-[10px] text-slate-500">Termasuk seluruh proses CoE, visa & pendampingan TSK Jepang.</p>
                    </div>
                  </div>

                  {/* TABEL CHECKLIST FASILITAS INCLUDE */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Tabel Fasilitas Include ({candidateIncludes.length} Terpilih)
                      </span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setCandidateIncludes([...PRESET_INCLUDES])}
                          className="text-emerald-700 hover:underline font-bold cursor-pointer"
                        >
                          Pilih Semua
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => setCandidateIncludes([])}
                          className="text-slate-500 hover:underline font-bold cursor-pointer"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-emerald-100/50 text-emerald-950 font-black text-[10px] uppercase border-b border-emerald-200">
                            <th className="py-2.5 px-3 w-10 text-center">PILIH</th>
                            <th className="py-2.5 px-3">FASILITAS / LAYANAN MATCHING JOB</th>
                            <th className="py-2.5 px-3 w-28 text-center">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px]">
                          {PRESET_INCLUDES.map((item, idx) => {
                            const isChecked = candidateIncludes.includes(item);
                            return (
                              <tr
                                key={idx}
                                onClick={() => {
                                  if (isChecked) {
                                    setCandidateIncludes(candidateIncludes.filter((c) => c !== item));
                                  } else {
                                    setCandidateIncludes([...candidateIncludes, item]);
                                  }
                                }}
                                className={`cursor-pointer transition-colors ${isChecked ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'bg-white hover:bg-slate-50'}`}
                              >
                                <td className="py-2 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 pointer-events-none"
                                  />
                                </td>
                                <td className="py-2 px-3 font-bold text-slate-800 flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${isChecked ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                  <span>{item}</span>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${isChecked ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                                    {isChecked ? 'Include ✓' : 'Exclude'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* BIODATA KANDIDAT */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/60 pb-2">
                    <Users className="w-4 h-4 text-[#0c2e59]" />
                    2. Biodata Pribadi & Pas Foto
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                    {/* Foto */}
                    <div className="flex flex-col items-center">
                      <div
                        onClick={() => fotoInputRef.current.click()}
                        className="w-28 h-36 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#0c2e59] bg-white flex flex-col items-center justify-center overflow-hidden cursor-pointer relative group transition"
                      >
                        {fotoPreview ? (
                          <>
                            <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold">
                              Ganti Foto
                            </div>
                          </>
                        ) : (
                          <div className="p-3 text-center">
                            <UploadCloud className="w-7 h-7 text-slate-400 mx-auto mb-1" />
                            <span className="text-[11px] font-bold text-slate-600 block">Pas Foto</span>
                            <span className="text-[9px] text-slate-400">JPG/PNG</span>
                          </div>
                        )}
                        <input
                          ref={fotoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files[0];
                            if (f) {
                              setFotoFile(f);
                              setFotoPreview(URL.createObjectURL(f));
                            }
                          }}
                          className="hidden"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 mt-1">Foto 3x4 / 4x6</span>
                    </div>

                    {/* Fields */}
                    <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-black text-slate-700 mb-1">
                          Nama Lengkap Kandidat <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={namaLengkap}
                          onChange={(e) => setNamaLengkap(e.target.value)}
                          placeholder="Contoh: Muhammad Budi Pratama"
                          className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0c2e59]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">
                          Usia (Tahun)
                        </label>
                        <input
                          type="number"
                          value={usia}
                          onChange={(e) => setUsia(e.target.value)}
                          placeholder="24"
                          className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">
                          Nomor WhatsApp
                        </label>
                        <input
                          type="tel"
                          value={noWa}
                          onChange={(e) => setNoWa(e.target.value)}
                          placeholder="08123456789"
                          className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">
                          Bidang Kerja SSW
                        </label>
                        <select
                          value={bidang}
                          onChange={(e) => setBidang(e.target.value)}
                          className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none"
                        >
                          {BIDANG_OPTIONS.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1">
                          Tahap Progress
                        </label>
                        <select
                          value={progress}
                          onChange={(e) => setProgress(e.target.value)}
                          className="w-full h-11 px-3.5 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none"
                        >
                          {PROGRESS_OPTIONS.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* UPLOAD BERKAS CV & SERTIFIKAT */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/60 pb-2">
                    <Award className="w-4 h-4 text-[#0c2e59]" />
                    3. Berkas CV & Sertifikat (JFT & SSW)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* CV */}
                    <div
                      onClick={() => cvInputRef.current.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white rounded-2xl p-4 text-center cursor-pointer transition"
                    >
                      <FileText className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
                      <p className="text-xs font-black text-slate-800">Berkas CV</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {cvFile ? cvFile.name : existingFiles.file_cv ? `Tersimpan` : "PDF / Word"}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-600 mt-1 block">
                        {cvFile ? "Ganti" : "+ Upload CV"}
                      </span>
                      <input
                        ref={cvInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={(e) => setCvFile(e.target.files[0])}
                        className="hidden"
                      />
                    </div>

                    {/* JFT */}
                    <div
                      onClick={() => jftInputRef.current.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-purple-500 bg-white rounded-2xl p-4 text-center cursor-pointer transition"
                    >
                      <Award className="w-7 h-7 text-purple-500 mx-auto mb-1.5" />
                      <p className="text-xs font-black text-slate-800">Sertifikat JFT</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {jftFile ? jftFile.name : existingFiles.file_jft ? `Tersimpan` : "A2 / N4"}
                      </p>
                      <span className="text-[10px] font-bold text-purple-600 mt-1 block">
                        {jftFile ? "Ganti" : "+ Upload JFT"}
                      </span>
                      <input
                        ref={jftInputRef}
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => setJftFile(e.target.files[0])}
                        className="hidden"
                      />
                    </div>

                    {/* SSW */}
                    <div
                      onClick={() => sswInputRef.current.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white rounded-2xl p-4 text-center cursor-pointer transition"
                    >
                      <Award className="w-7 h-7 text-blue-500 mx-auto mb-1.5" />
                      <p className="text-xs font-black text-slate-800">Sertifikat SSW</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {sswFile ? sswFile.name : existingFiles.file_ssw ? `Tersimpan` : "SSW Bidang"}
                      </p>
                      <span className="text-[10px] font-bold text-blue-600 mt-1 block">
                        {sswFile ? "Ganti" : "+ Upload SSW"}
                      </span>
                      <input
                        ref={sswInputRef}
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => setSswFile(e.target.files[0])}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-7 py-3 rounded-xl bg-[#0c2e59] hover:bg-[#143e74] text-white text-xs font-black shadow-md transition disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Menyimpan Kandidat...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{modalMode === "edit" ? "Simpan Perubahan" : "Simpan Kandidat"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* MODAL: DETAIL DOSSIER KANDIDAT LENGKAP */}
        {/* ================================================================ */}
        {isDetailOpen && selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden my-6">
              
              <div className="px-6 py-5 bg-gradient-to-r from-[#0c2e59] via-[#164e87] to-[#1e4e8c] text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-black">Dossier Lengkap Kandidat Matching Job</h3>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  aria-label="Tutup detail dossier kandidat"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-5 max-h-[80vh] overflow-y-auto">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-5 border-b border-slate-100">
                  {selectedCandidate.foto ? (
                    <img
                      src={getFileUrl(selectedCandidate.foto)}
                      alt={selectedCandidate.nama_lengkap}
                      className="w-24 h-32 rounded-2xl object-cover ring-2 ring-slate-200 shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-32 rounded-2xl bg-[#0c2e59] text-white flex items-center justify-center text-2xl font-black shadow-md">
                      {selectedCandidate.nama_lengkap?.slice(0, 2).toUpperCase() || "KD"}
                    </div>
                  )}

                  <div className="flex-1 text-center sm:text-left space-y-1.5">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                        {selectedCandidate.bidang || "SSW"}
                      </span>
                      {selectedCandidate.usia && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                          {selectedCandidate.usia} Tahun
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl font-black text-slate-900">{selectedCandidate.nama_lengkap}</h3>

                    <p className="text-xs font-bold text-slate-600 flex items-center justify-center sm:justify-start gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      LPK Pengirim: <span className="text-blue-900">{selectedCandidate.lpk_pengirim || "Creativa / Mandiri"}</span>
                    </p>

                    <div className="pt-1">
                      {(() => {
                        const m = getProgressMeta(selectedCandidate.progress);
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${m.bg} ${m.text} ${m.border}`}>
                            <span className={`w-2 h-2 rounded-full ${m.dot}`}></span>
                            Progress: {m.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* INFO LOWONGAN JOB DITUJU & BIAYA */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 space-y-2">
                  <span className="text-[11px] font-black text-blue-900 uppercase tracking-wider block">
                    Informasi Matching Job & Fasilitas:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-bold block text-[11px]">Posisi Lowongan:</span>
                      <span className="font-black text-slate-900">
                        {selectedCandidate.job_title || "Belum ditautkan ke Job Order"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-bold block text-[11px]">Asal Lembaga (TSK/LPK):</span>
                      <span className="font-bold text-purple-900">
                        {selectedCandidate.tsk_name
                          ? `[TSK] ${selectedCandidate.tsk_name}`
                          : selectedCandidate.source_name
                          ? `[${selectedCandidate.source_type || "TSK"}] ${selectedCandidate.source_name}`
                          : "-"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-bold block text-[11px]">Total Biaya Matching Job:</span>
                      <span className="font-black text-emerald-800 text-sm">
                        {formatRupiah(selectedCandidate.biaya_matching_efektif || selectedCandidate.total_biaya || 0)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 font-bold block text-[11px]">Lokasi Penempatan:</span>
                      <span className="font-bold text-slate-800">
                        {selectedCandidate.lokasi_jepang || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Checklist Include */}
                  {Array.isArray(selectedCandidate.effective_includes) && selectedCandidate.effective_includes.length > 0 && (
                    <div className="pt-2 border-t border-blue-200/60">
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">
                        Fasilitas yang Include:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedCandidate.effective_includes.map((inc, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-emerald-900 text-[10px] font-bold border border-emerald-200"
                          >
                            <Check className="w-2.5 h-2.5 text-emerald-600" /> {inc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Kontak */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">WhatsApp</span>
                    <p className="text-xs font-black text-slate-800 mt-0.5">
                      {selectedCandidate.no_wa ? (
                        <a
                          href={`https://wa.me/${selectedCandidate.no_wa.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:underline"
                        >
                          {selectedCandidate.no_wa}
                        </a>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                    <p className="text-xs font-black text-slate-800 mt-0.5 truncate">
                      {selectedCandidate.email || "-"}
                    </p>
                  </div>
                </div>

                {/* Dokumen & Sertifikat */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Berkas Lampiran</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-black text-slate-700 block">CV Kandidat</span>
                        <span className="text-[10px] text-slate-400">
                          {selectedCandidate.file_cv ? "Tersedia" : "Belum ada"}
                        </span>
                      </div>
                      {selectedCandidate.file_cv && (
                        <a
                          href={getFileUrl(selectedCandidate.file_cv)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 text-center py-1 px-2 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]"
                        >
                          Unduh CV
                        </a>
                      )}
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-black text-slate-700 block">Sertifikat JFT</span>
                        <span className="text-[10px] text-slate-400">
                          {selectedCandidate.file_jft ? "Tersedia" : "Belum ada"}
                        </span>
                      </div>
                      {selectedCandidate.file_jft && (
                        <a
                          href={getFileUrl(selectedCandidate.file_jft)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 text-center py-1 px-2 rounded bg-purple-50 text-purple-700 font-bold text-[10px]"
                        >
                          Unduh JFT
                        </a>
                      )}
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-black text-slate-700 block">Sertifikat SSW</span>
                        <span className="text-[10px] text-slate-400">
                          {selectedCandidate.file_ssw ? "Tersedia" : "Belum ada"}
                        </span>
                      </div>
                      {selectedCandidate.file_ssw && (
                        <a
                          href={getFileUrl(selectedCandidate.file_ssw)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 text-center py-1 px-2 rounded bg-blue-50 text-blue-700 font-bold text-[10px]"
                        >
                          Unduh SSW
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* History */}
                <div className="rounded-xl border border-slate-200 p-3.5 space-y-2">
                  <h4 className="text-xs font-black text-slate-800">Riwayat Perubahan Progress</h4>
                  <div className="max-h-36 overflow-y-auto space-y-1 text-xs">
                    {history.map((h, i) => (
                      <p key={i} className="border-t border-slate-100 py-1 text-[11px] text-slate-600">
                        <span className="font-bold text-slate-800">{h.created_at?.slice(0, 16)}</span>: {h.action}{" "}
                        {h.previous_status && `(${h.previous_status} ➔ ${h.next_status})`} • {h.notes}
                      </p>
                    ))}
                    {!history.length && <p className="text-[11px] text-slate-400">Belum ada riwayat aktivitas.</p>}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleOpenEditCandidate(selectedCandidate);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black"
                >
                  Edit Data
                </button>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* MODAL: DETAIL LOWONGAN JOB ORDER */}
        {/* ================================================================ */}
        {isJobDetailOpen && selectedJobDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden my-6">
              <div className="px-6 py-5 bg-gradient-to-r from-[#0c2e59] to-[#164e87] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-black">Detail Lowongan Job (Job Order)</h3>
                </div>
                <button
                  onClick={() => setIsJobDetailOpen(false)}
                  aria-label="Tutup detail lowongan job"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
                <div>
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-purple-50 text-purple-800 border border-purple-200">
                    {selectedJobDetail.source_type} • {selectedJobDetail.source_name}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{selectedJobDetail.job_title}</h3>
                  <span className="font-bold text-blue-600">{selectedJobDetail.bidang}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px]">Lokasi Penempatan:</span>
                    <span className="font-bold text-slate-800">{selectedJobDetail.lokasi_jepang}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px]">Estimasi Gaji Pokok:</span>
                    <span className="font-bold text-slate-800">{selectedJobDetail.estimasi_gaji || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px]">Total Biaya Matching Job:</span>
                    <span className="font-black text-emerald-700 text-sm">{formatRupiah(selectedJobDetail.total_biaya)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px]">Kuota:</span>
                    <span className="font-bold text-slate-800">{selectedJobDetail.total_kandidat || 0} / {selectedJobDetail.kuota} Orang</span>
                  </div>
                </div>

                {/* Include Items */}
                <div className="space-y-2">
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
                    Fasilitas & Layanan yang Include:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(Array.isArray(selectedJobDetail.include_items_array)
                      ? selectedJobDetail.include_items_array
                      : []
                    ).map((inc, i) => (
                      <div key={i} className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold text-emerald-950 text-xs">{inc}</span>
                      </div>
                    ))}
                  </div>
                  {selectedJobDetail.exclude_items && (
                    <p className="text-[11px] text-slate-500 pt-1">
                      <b>Exclude (Belum Termasuk):</b> {selectedJobDetail.exclude_items}
                    </p>
                  )}
                </div>

                {/* Kandidat Yang Melamar Dari LPK Pengirim Mana Saja */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
                    Kandidat Terdaftar ({selectedJobDetail.candidates?.length || 0}):
                  </h4>
                  {selectedJobDetail.candidates?.length > 0 ? (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {selectedJobDetail.candidates.map((cand, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-black text-slate-800">{cand.nama_lengkap}</span>
                            <span className="text-slate-500 text-[11px] ml-2 font-semibold">
                              (LPK Pengirim: {cand.lpk_pengirim || "Creativa"})
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700">
                            {cand.progress}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-xs">Belum ada kandidat yang melamar ke lowongan ini.</p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsJobDetailOpen(false);
                    handleOpenEditJob(selectedJobDetail);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black"
                >
                  Edit Lowongan
                </button>
                <button
                  onClick={() => setIsJobDetailOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* MODAL: PREVIEW FILE GAMBAR / PDF */}
        {/* ================================================================ */}
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in">
            <div className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <span className="text-xs font-bold truncate max-w-md">{previewFile.name}</span>
                <button
                  onClick={() => setPreviewFile(null)}
                  aria-label="Tutup pratinjau file"
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100">
                {previewFile.isImage ? (
                  <img
                    src={previewFile.url}
                    alt="Preview"
                    className="max-w-full max-h-[75vh] object-contain rounded-xl shadow"
                  />
                ) : (
                  <iframe
                    src={previewFile.url}
                    title="Document Preview"
                    className="w-full h-[75vh] rounded-xl border border-slate-200"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
