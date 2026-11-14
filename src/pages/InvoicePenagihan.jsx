import { useState, useEffect, useCallback, useRef } from "react";

import axios from "axios";
import Swal from "sweetalert2";
import { serverDeliveryRows, serverPaymentRows } from "../utils/studentInvoice";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Layout from "../components/Layout";
import BuatInvoiceWizardModal from "../components/BuatInvoiceWizardModal";
import InvoiceEmailButton from "../components/InvoiceEmailButton";
import PaymentReceiptActions from "../components/PaymentReceiptActions";
import {reconcilePayment, showPaymentResult, openOfficialReceipt} from "../utils/paymentReceipt";
import {
  Receipt, FileText, Send, CreditCard, BarChart2,
  TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle,
  XCircle, Search, RefreshCw, Plus, ChevronLeft, ChevronRight,
  Eye, Download, Trash2, Calendar, Users, User,
  ArrowUpRight, Wallet, Mail, MessageCircle, AlertTriangle,
  ShieldCheck, Hourglass, ArrowRight, Pencil, Phone, X,
  Building2, Hash, CalendarDays, Banknote, Tag, PieChart,
  Settings, CheckSquare, Square, Printer, Check, PlusCircle, Sparkles, HelpCircle,
  Image as ImageIcon, ExternalLink, ZoomIn, FileCheck, UploadCloud, QrCode, Link2
} from "lucide-react";

const formatRp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

const MONTHS_SHORT_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agust", "Sep", "Okt", "Nov", "Des"];
const MONTHS_UPPER_ID = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];

export function formatRpNoDecimals(n) {
  const rounded = Math.round(Number(n) || 0);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatRpComma(n, withSpace = false) {
  const num = Number(n || 0);
  const abs = Math.abs(num);
  const fixed = abs.toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sign = num < 0 ? "-" : "";
  return `${sign}${withSpace ? "Rp " : "Rp"}${grouped},${decPart}`;
}

function parseInvoiceDateParts(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const year = Number(iso[1]);
    const monthIdx = Number(iso[2]) - 1;
    const day = Number(iso[3]);
    if (monthIdx >= 0 && monthIdx < 12 && day >= 1 && day <= 31) {
      return { year, monthIdx, day };
    }
  }
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    const year = Number(slash[3]);
    // Treat MM/DD/YYYY when first part <= 12 and second > 12, otherwise DD/MM/YYYY
    const monthIdx = (a <= 12 && b > 12 ? a : b <= 12 ? b : a) - 1;
    const day = (a <= 12 && b > 12 ? b : b <= 12 ? a : b);
    if (monthIdx >= 0 && monthIdx < 12) {
      return { year, monthIdx, day };
    }
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return { year: parsed.getFullYear(), monthIdx: parsed.getMonth(), day: parsed.getDate() };
  }
  return null;
}

export function formatInvoiceDateShort(dateStr) {
  const parts = parseInvoiceDateParts(dateStr);
  if (!parts) return dateStr ? String(dateStr) : "-";
  return `${MONTHS_SHORT_ID[parts.monthIdx]} ${parts.day}, ${parts.year}`;
}

export function formatInvoiceDateUpper(dateStr) {
  const parts = parseInvoiceDateParts(dateStr);
  if (!parts) return dateStr ? String(dateStr).toUpperCase() : "-";
  return `${MONTHS_UPPER_ID[parts.monthIdx]} ${String(parts.day).padStart(2, "0")}, ${parts.year}`;
}

let cachedKopLogoDataUrl = null;
let cachedDirectorStampDataUrl = null;

if (typeof window !== "undefined") {
  fetch("/images/creativa-kop-logo.png")
    .then((res) => (res.ok ? res.blob() : null))
    .then((blob) => {
      if (!blob) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          cachedKopLogoDataUrl = reader.result;
        }
      };
      reader.readAsDataURL(blob);
    })
    .catch(() => { });
}

function drawArcTextOnCanvas(ctx, text, cx, cy, radius, startAngle, stepAngle, inward = false) {
  ctx.save();
  for (let i = 0; i < text.length; i++) {
    const angle = startAngle + i * stepAngle;
    ctx.save();
    ctx.translate(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.rotate(angle + (inward ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function drawCanvasStar(ctx, cx, cy, outerR, innerR) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

export function createDirectorStampDataURL() {
  if (cachedDirectorStampDataUrl) return cachedDirectorStampDataUrl;
  if (typeof document === "undefined") return "";

  const canvas = document.createElement("canvas");
  canvas.width = 560;
  canvas.height = 220;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. BLUE CIRCULAR COMPANY STAMP (Right side, overlapping signature)
  const cx = 368;
  const cy = 110;
  const stampBlue = "#1a52b8";

  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.strokeStyle = stampBlue;
  ctx.fillStyle = stampBlue;

  // Outer & inner rings
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 92, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, 58, 0, Math.PI * 2);
  ctx.stroke();

  // Inner 4-petal Creativa emblem + center dot
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 2);
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.bezierCurveTo(13, -17, 22, -28, 22, -43);
    ctx.bezierCurveTo(7, -43, 2, -42, -9, -39);
    ctx.bezierCurveTo(-13, -29, -8, -19, 0, -17);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Curved stamp text: top "CREATIVA BRIDGING", stars left/right, bottom "INTERNATIONAL"
  ctx.font = "bold 20px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const trackR = 75;
  const topText = "CREATIVA BRIDGING";
  const topSpan = 3.05;
  const topStep = topSpan / (topText.length - 1);
  drawArcTextOnCanvas(ctx, topText, cx, cy, trackR, -Math.PI / 2 - topSpan / 2, topStep, false);

  const botText = "INTERNATIONAL";
  const botSpan = 2.15;
  const botStep = botSpan / (botText.length - 1);
  drawArcTextOnCanvas(ctx, botText, cx, cy, trackR, Math.PI / 2 + botSpan / 2, -botStep, true);

  drawCanvasStar(ctx, cx - 73, cy + 16, 5.5, 2.3);
  drawCanvasStar(ctx, cx + 73, cy + 16, 5.5, 2.3);
  ctx.restore();

  // 2. BLACK CALLIGRAPHIC SIGNATURE (Siti Nurhatifah, overlapping stamp on left)
  ctx.save();
  ctx.strokeStyle = "#0f172a";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Sweeping left 'S' loop & flourish
  ctx.lineWidth = 4.6;
  ctx.beginPath();
  ctx.moveTo(148, 56);
  ctx.bezierCurveTo(108, 24, 52, 58, 72, 92);
  ctx.bezierCurveTo(88, 118, 174, 122, 162, 148);
  ctx.bezierCurveTo(150, 174, 48, 152, 42, 124);
  ctx.bezierCurveTo(38, 106, 92, 98, 154, 112);
  ctx.stroke();

  // Main tall vertical stem & lower descender loop
  ctx.lineWidth = 4.4;
  ctx.beginPath();
  ctx.moveTo(142, 34);
  ctx.bezierCurveTo(126, 70, 118, 154, 126, 188);
  ctx.bezierCurveTo(132, 198, 150, 184, 152, 148);
  ctx.bezierCurveTo(154, 108, 162, 58, 168, 44);
  ctx.bezierCurveTo(170, 82, 170, 126, 174, 146);
  ctx.stroke();

  // Horizontal stroke + flowing lowercase tail into stamp
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.moveTo(76, 118);
  ctx.bezierCurveTo(126, 118, 184, 112, 232, 114);
  ctx.bezierCurveTo(212, 114, 194, 122, 198, 134);
  ctx.bezierCurveTo(202, 144, 218, 134, 224, 114);
  ctx.bezierCurveTo(222, 132, 228, 144, 238, 134);
  ctx.bezierCurveTo(246, 126, 250, 110, 258, 116);
  ctx.bezierCurveTo(260, 136, 252, 162, 244, 172);
  ctx.bezierCurveTo(242, 152, 256, 128, 272, 118);
  ctx.bezierCurveTo(278, 136, 290, 122, 294, 102);
  ctx.bezierCurveTo(298, 86, 286, 86, 284, 108);
  ctx.bezierCurveTo(284, 126, 304, 130, 326, 118);
  ctx.bezierCurveTo(342, 112, 356, 116, 368, 122);
  ctx.stroke();
  ctx.restore();

  cachedDirectorStampDataUrl = canvas.toDataURL("image/png");
  return cachedDirectorStampDataUrl;
}

export function normalizeFinanceStatus(status) {
  if (!status) return "Unpaid";
  const s = String(status).trim().toLowerCase();
  if (s === "lunas" || s === "paid") return "Paid";
  if (s === "sebagian" || s === "sebagian dibayar" || s === "partially paid" || s === "partial") return "Partially Paid";
  if (s === "overdue" || s === "lewat jatuh tempo" || s === "past due") return "Overdue";
  return "Unpaid";
}

function isPdfProof(src, mime = "") {
  return mime === "application/pdf" || /^data:application\/pdf/i.test(String(src || "")) || /\.pdf(?:$|[?#])/i.test(String(src || ""));
}

function PaymentProofThumbnail({ payment, sizeClass = "w-14 h-14" }) {
  const src = payment?.buktiBayar || payment?.buktiFoto || payment?.buktiBayarUrl || "";
  const mime = payment?.proof_mime || payment?.buktiMime || "";
  const [failed, setFailed] = useState(false);

  return (
    <div className={`${sizeClass} rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center`}>
      {src && !failed && !isPdfProof(src, mime) ? (
        <img src={src} alt="Bukti transfer" className="w-full h-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-0.5 text-slate-400">
          {isPdfProof(src, mime) ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
          <span className="text-[8px]">{src ? (isPdfProof(src, mime) ? "PDF" : "Tidak tersedia") : "Belum ada bukti"}</span>
        </div>
      )}
    </div>
  );
}


const TABS = ["Daftar Invoice", "Invoice Terkirim", "Pembayaran", "Siswa", "Riwayat RPA & QRIS"];

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────








// ─── STATUS STYLES ────────────────────────────────────────────────────────────
const STATUS_INV = {
  "Paid": "bg-emerald-50 text-emerald-600 border border-emerald-200",
  "Partially Paid": "bg-amber-50 text-amber-600 border border-amber-200",
  "Unpaid": "bg-rose-50 text-rose-600 border border-rose-200",
  "Overdue": "bg-red-100 text-red-700 border border-red-300",
  "Lunas": "bg-emerald-50 text-emerald-600 border border-emerald-200",
  "Sebagian": "bg-amber-50 text-amber-600 border border-amber-200",
  "Belum Dibayar": "bg-rose-50 text-rose-600 border border-rose-200",
  "Belum Lunas": "bg-rose-50 text-rose-600 border border-rose-200"
};
const STATUS_KIRIM = { "Terkirim": "bg-emerald-100 text-emerald-700", "SMTP Accepted": "bg-emerald-100 text-emerald-700", "Pending": "bg-amber-100 text-amber-700", "Failed": "bg-red-100 text-red-600", "Gagal": "bg-red-100 text-red-600" };
const STATUS_BACA = { "Dibaca": "bg-blue-100 text-blue-700", "Pending": "bg-amber-100 text-amber-700", "–": "bg-slate-100 text-slate-400" };
const STATUS_VERIF = { "Terverifikasi": "bg-emerald-100 text-emerald-700", "Menunggu": "bg-amber-100 text-amber-700" };
const STATUS_SISWA = { "Prioritas": "bg-violet-100 text-violet-700", "Aktif": "bg-emerald-100 text-emerald-700", "Menunggak": "bg-red-100 text-red-600", "Baru": "bg-blue-100 text-blue-700" };

// ─── DOWNLOAD HELPER ──────────────────────────────────────────────────────────
function downloadAsCSV(filename, headers, rows) {
  const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── CONFIRM DELETE MODAL ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ label, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-center text-lg font-black text-slate-800 mb-1">Hapus Data?</h3>
        <p className="text-center text-sm text-slate-500 mb-6">
          Data <span className="font-bold text-slate-700">{label}</span> akan dihapus secara permanen dan tidak dapat dikembalikan.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
            Batal
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition shadow-sm shadow-red-200">
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

const METODE_CICILAN = [
  { label: "DP Pendaftaran", amount: 5000000 },
  { label: "Cicilan Ke-2", amount: 4000000 },
  { label: "Cicilan Ke-3", amount: 3000000 },
  { label: "Cicilan Ke-4", amount: 2000000 },
  { label: "Cicilan Ke-5", amount: 2000000 },
  { label: "Cicilan Ke-6", amount: 2000000 },
  { label: "Full Payment", amount: 15000000 },
];

export const OFFICIAL_INCLUSIONS_DEFAULT = [
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

export const OFFICIAL_EXCLUSIONS_DEFAULT = [
  "Biaya Utilitas (Air, Listrik, Internet, & IPL Asrama per Bulan)",
  "Biaya Makan",
  "Keperluan Pribadi Lainnya",
];

export function enrichInvoiceData(rawInv = {}) {
  const merged = { ...rawInv };

  const grandTotal = Number(merged.total) || 0;
  const discountAmount = Number(merged.discount?.amount) || 0;

  let items;
  if (Array.isArray(merged.items) && merged.items.length > 0) {
    items = merged.items.map((it) => {
      const titleRaw = it.deskripsi || it.name || "Program Pelatihan";
      const [splitTitle, ...restTitle] = String(titleRaw).split("\n");
      const subtitleRaw = it.subdeskripsi || it.subtitle || restTitle.join(" ").trim();
      const price = Number(it.price ?? it.harga ?? 0);
      const diskon = Number(it.diskon ?? 0);
      const amount = Number(it.amount ?? Math.max(0, Number(it.jumlah ?? price) - diskon));
      return {
        title: splitTitle,
        subtitle: subtitleRaw,
        price,
        diskon,
        amount,
      };
    });
  } else {
    const ket = String(merged.keterangan || "").trim();
    const prog = String(merged.program || "").trim();
    const isCicilLabel = ket.toLowerCase().includes("cicil");
    const defaultTitle =
      prog ||
      (ket ? ket : `Kelas Intensif Offline (${isCicilLabel ? "Cicilan" : "Full Payment"})`);
    const locSuffix = merged.lokasi ? `- ${merged.lokasi}` : "- Cianjur";
    items = [
      {
        title: defaultTitle,
        subtitle: `Biaya Pendidikan Bahasa Jepang dan Pelatihan Skill ${locSuffix}`,
        price: grandTotal,
        diskon: 0,
        amount: grandTotal,
      },
    ];
  }

  const computedSubtotal = items.reduce((acc, it) => acc + (Number(it.price) || 0), 0);
  const subtotal = Number(merged.subtotal) || (discountAmount > 0 ? computedSubtotal : grandTotal) || computedSubtotal;
  const effectiveDiscount = discountAmount || Math.max(0, subtotal - grandTotal);

  const stNorm = normalizeFinanceStatus(merged.status);
  const paidAmount = Number(merged.terbayar) || 0;
  const amountDue = merged.sisa != null && stNorm !== "Unpaid"
    ? Math.max(0, Number(merged.sisa))
    : Math.max(0, grandTotal - paidAmount);

  const includes = Array.isArray(merged.includes) && merged.includes.length > 0
    ? merged.includes
    : OFFICIAL_INCLUSIONS_DEFAULT;

  const excludes = Array.isArray(merged.excludes) && merged.excludes.length > 0
    ? merged.excludes
    : OFFICIAL_EXCLUSIONS_DEFAULT;

  let installments;
  if (Array.isArray(merged.installments) && merged.installments.length > 0) {
    installments = merged.installments.map((inst, idx) => ({
      description: String(
        inst.keterangan ||
        inst.deskripsi ||
        inst.label ||
        (merged.installments.length === 1 ? "FULL PAYMENT" : `CICILAN KE-${idx + 1}`)
      ).toUpperCase(),
      date: inst.jatuhTempo || inst.tanggal || merged.jatuhTempo || merged.tanggal,
      amount: Number(inst.nominal ?? inst.amount ?? 0),
    }));
  } else if (/cicil/i.test(String(merged.skema || merged.keterangan || ''))) {
    installments = [];
  } else {
    installments = [{ description: 'FULL PAYMENT', date: merged.jatuhTempo || merged.tanggal, amount: grandTotal }];
  }

  // Missing official bank metadata stays visibly unavailable, including on legacy invoices.
  const bankName = merged.bank_name || 'Belum tersedia';
  const accountNumber = merged.account_number || 'Belum tersedia';
  const accountHolder = merged.account_holder || 'Belum terverifikasi';

  const rawNotes = String(merged.notes || merged.catatan || "").trim();
  const isLegacyBoilerplate =
    rawNotes.includes("Cara Pembayaran") ||
    rawNotes.includes("Invoice ini bersifat confidential");
  const customNotes = rawNotes && !isLegacyBoilerplate ? rawNotes : "";

  return {
    ...merged,
    items,
    subtotal,
    discountAmount: effectiveDiscount,
    grandTotal,
    amountDue,
    includes,
    excludes,
    installments,
    bank: { bankName, accountNumber, accountHolder },
    customNotes,
  };
}

function drawInvoiceKopSurat(doc, inv) {
  if (inv.showKop === false) {
    return 18;
  }

  if (inv.showLogo !== false) {
    let drewImage = false;
    try {
      if (cachedKopLogoDataUrl) {
        doc.addImage(cachedKopLogoDataUrl, "PNG", 14, 12, 50, 20);
        drewImage = true;
      } else if (typeof Image !== "undefined") {
        const logoImg = new Image();
        logoImg.src = "/images/creativa-kop-logo.png";
        if (logoImg.complete && logoImg.naturalWidth > 0) {
          doc.addImage(logoImg, "PNG", 14, 12, 50, 20);
          drewImage = true;
        }
      }
    } catch {
      drewImage = false;
    }

    if (!drewImage) {
      doc.setTextColor(30, 58, 138);
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text("CREATIVA BRIDGING", 14, 20);
      doc.text("INTERNATIONAL", 14, 26);
    }
  } else {
    doc.setTextColor(30, 58, 138);
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("CREATIVA BRIDGING", 14, 20);
    doc.text("INTERNATIONAL", 14, 26);
  }

  // Right: Kop Surat Teks (persis gambar 1)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(24);
  doc.setFont("times", "bold");
  doc.text("INVOICE", 196, 18, { align: "right" });

  doc.setFontSize(9.5);
  doc.setFont("times", "bold");
  doc.text("PT. Creativa Bridging International", 196, 24, { align: "right" });

  doc.setFontSize(8.5);
  doc.setFont("times", "normal");
  doc.text("Ruko Business Park, Jl. Ir. H. Juanda, Panembong, Ruko B1", 196, 29, { align: "right" });
  doc.text("Mekarsari, Kec. Cianjur, Kab. Cianjur, Jawa Barat 43211", 196, 34, { align: "right" });
  doc.text("+62 815-2222-672 | creativabridging.com", 196, 39, { align: "right" });

  // Double Line Separator
  const sepY = 43;
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.6);
  doc.line(14, sepY, 196, sepY);
  doc.setLineWidth(0.2);
  doc.line(14, sepY + 1.2, 196, sepY + 1.2);

  return 52;
}

function ensureInvoicePageSpace(doc, currentY, neededHeight, inv) {
  if (currentY + neededHeight > 276) {
    doc.addPage();
    return drawInvoiceKopSurat(doc, inv);
  }
  return currentY;
}

// ─── HELPER: Generate & Download / Preview Official Invoice PDF ───────────────────────────
export function generateInvoicePDF(rawInv, mode = "download") {
  const inv = enrichInvoiceData(rawInv);
  const doc = new jsPDF({ format: "a4" });
  doc.setProperties({
    title: `INVOICE - ${inv.id || "INVOICE"} - ${(inv.customer || "").toUpperCase()}`,
  });

  // 1. KOP SURAT RESMI (Page 1 & repeating on page breaks)
  let currentY = drawInvoiceKopSurat(doc, inv);

  // 2. META DATA (To Customer & Invoice Info — gambar 2)
  const metaStartY = currentY;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("To,", 14, metaStartY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(0, 0, 0);
  doc.text(inv.customer ? String(inv.customer).toUpperCase() : "-", 14, metaStartY + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(107, 114, 128);
  let contactY = metaStartY + 14.5;
  if (inv.phone && inv.phone !== "-") {
    doc.text(String(inv.phone), 14, contactY);
    contactY += 4.8;
  }
  if (inv.email && inv.email !== "-") {
    doc.text(String(inv.email), 14, contactY);
  }

  // Right Meta (Invoice Number, Invoice Date, Payment Due, Amount Due)
  const metaRows = [
    ["Invoice Number", String(inv.id || "-")],
    ["Invoice Date", formatInvoiceDateShort(inv.tanggal)],
    ["Payment Due", formatInvoiceDateShort(inv.jatuhTempo)],
    ["Amount Due", formatRpComma(inv.amountDue)],
  ];
  doc.setFontSize(9.5);
  metaRows.forEach(([label, value], idx) => {
    const y = metaStartY + idx * 5.2;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(label, 155, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(17, 24, 39);
    doc.text(`: ${value}`, 157, y);
  });

  currentY = Math.max(metaStartY + 25, contactY + 4);

  // 3. ITEMS SECTION HEADER BAR (Items | Price | Amount)
  doc.setFillColor(22, 54, 96);
  doc.rect(14, currentY, 182, 7.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text("Items", 17, currentY + 5.1);
  doc.text("Price", 156, currentY + 5.1, { align: "right" });
  doc.text("Amount", 193, currentY + 5.1, { align: "right" });

  currentY += 12.5;

  // Item Rows (clean white flow matching gambar 2)
  inv.items.forEach((it) => {
    const titleLines = doc.splitTextToSize(String(it.title || "Program Pelatihan"), 106);
    const subLines = it.subtitle ? doc.splitTextToSize(String(it.subtitle), 106) : [];
    const blockH = titleLines.length * 4.6 + subLines.length * 4.3 + (it.diskon > 0 ? 4.5 : 0) + 4;
    currentY = ensureInvoicePageSpace(doc, currentY, blockH, inv);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(titleLines, 16, currentY);
    doc.text(formatRpNoDecimals(it.price), 156, currentY, { align: "right" });
    doc.text(formatRpNoDecimals(it.amount), 193, currentY, { align: "right" });

    let itemCursorY = currentY + titleLines.length * 4.6;
    if (subLines.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(55, 65, 81);
      doc.text(subLines, 16, itemCursorY + 0.5);
      itemCursorY += subLines.length * 4.3 + 0.5;
    }
    if (it.diskon > 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`(Diskon: -${formatRpNoDecimals(it.diskon)})`, 16, itemCursorY + 0.8);
      itemCursorY += 4.2;
    }
    currentY = itemCursorY + 4;
  });

  // 4. BIAYA SUDAH TERMASUK (Numbered 1..10 — gambar 2 & 3)
  currentY = ensureInvoicePageSpace(doc, currentY + 1, 20, inv);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Biaya Sudah Termasuk:", 16, currentY);
  currentY += 5.5;

  inv.includes.forEach((itemText, idx) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(31, 41, 55);
    const wrapped = doc.splitTextToSize(String(itemText), 158);
    const needed = wrapped.length * 4.4 + 1.1;
    currentY = ensureInvoicePageSpace(doc, currentY, needed, inv);
    doc.text(`${idx + 1}.`, 24, currentY, { align: "right" });
    doc.text(wrapped, 27, currentY);
    currentY += needed;
  });

  // 5. BIAYA TIDAK TERMASUK (Numbered 1..3 — gambar 3..5)
  currentY += 3;
  const estExclHeight = 8 + Math.min(inv.excludes.length, 3) * 6;
  currentY = ensureInvoicePageSpace(doc, currentY, estExclHeight, inv);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Biaya Tidak Termasuk:", 16, currentY);
  currentY += 5.5;

  inv.excludes.forEach((itemText, idx) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(31, 41, 55);
    const wrapped = doc.splitTextToSize(String(itemText), 158);
    const needed = wrapped.length * 4.4 + 1.1;
    currentY = ensureInvoicePageSpace(doc, currentY, needed, inv);
    doc.text(`${idx + 1}.`, 24, currentY, { align: "right" });
    doc.text(wrapped, 27, currentY);
    currentY += needed;
  });

  // 6. TOTALS WITH HORIZONTAL LINES (Subtotal / Total / Amount Due (IDR) — gambar 5)
  currentY = ensureInvoicePageSpace(doc, currentY + 4, 34, inv);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.35);
  doc.line(14, currentY, 196, currentY);
  currentY += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Subtotal:", 161, currentY, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(formatRpComma(inv.subtotal), 194, currentY, { align: "right" });

  if (inv.discountAmount > 0) {
    currentY += 3;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.25);
    doc.line(118, currentY, 196, currentY);
    currentY += 5.5;
    doc.setFont("helvetica", "bold");
    doc.text(`Discount${inv.discount?.desc ? ` (${inv.discount.desc})` : ""}:`, 161, currentY, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(`- ${formatRpComma(inv.discountAmount)}`, 194, currentY, { align: "right" });
  }

  currentY += 3;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.25);
  doc.line(118, currentY, 196, currentY);
  currentY += 5.5;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Total:", 161, currentY, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(formatRpComma(inv.grandTotal), 194, currentY, { align: "right" });

  currentY += 3;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.25);
  doc.line(118, currentY, 196, currentY);
  currentY += 5.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Amount Due (IDR):", 161, currentY, { align: "right" });
  doc.text(formatRpComma(inv.amountDue, true), 194, currentY, { align: "right" });

  currentY += 10;

  // 7. INSTALLMENT TABLE (Description | Date | Amount — gambar 6)
  currentY = ensureInvoicePageSpace(doc, currentY, 32, inv);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(0, 0, 0);
  doc.text("Installment", 14, currentY);
  currentY += 4.5;

  const instStartPage = doc.getNumberOfPages();
  const installmentRows = inv.installments.map((inst) => [
    String(inst.description || "FULL PAYMENT").toUpperCase(),
    formatInvoiceDateUpper(inst.date),
    formatRpComma(inst.amount),
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14, top: inv.showKop !== false ? 52 : 18 },
    head: [["Description", "Date", "Amount"]],
    body: installmentRows,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9.5,
      textColor: [0, 0, 0],
      lineColor: [203, 213, 225],
      lineWidth: 0.25,
      cellPadding: 2.8,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: 66, halign: "left" },
      1: { cellWidth: 64, halign: "left" },
      2: { cellWidth: 52, halign: "right" },
    },
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index === 2) {
        data.cell.styles.halign = "right";
      }
    },
    didDrawPage: (data) => {
      if (data.pageNumber > instStartPage) {
        drawInvoiceKopSurat(doc, inv);
      }
    },
  });

  currentY = doc.lastAutoTable.finalY + 9;

  // 8. NOTES / TERMS SECTION (gambar 6)
  currentY = ensureInvoicePageSpace(doc, currentY, 26, inv);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Notes/Terms", 14, currentY);
  currentY += 5.5;



  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39);
  const sswTermLines = doc.splitTextToSize(
    "Biaya ujian SSW selain program SSW kaigo, pengolahan makanan, pertanian, perikanan, dan restoran dikenakan biaya tambahan Rp 500.000.",
    182
  );
  doc.text(sswTermLines, 14, currentY);
  currentY += sswTermLines.length * 4.4 + 1.5;

  if (inv.customNotes) {
    const customNoteLines = doc.splitTextToSize(inv.customNotes, 182);
    currentY = ensureInvoicePageSpace(doc, currentY, customNoteLines.length * 4.4 + 4, inv);
    doc.text(customNoteLines, 14, currentY);
    currentY += customNoteLines.length * 4.4 + 1.5;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text("https://creativabridging.com/", 14, currentY);
  currentY += 9;

  // 9. CONFIDENTIAL, CARA PEMBAYARAN, TEAM CONTACT & DIRECTOR STAMP/SIGNATURE (gambar 7 & 8)
  currentY = ensureInvoicePageSpace(doc, currentY, 108, inv);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39);
  doc.text("Invoice bersifat confidential (rahasia)", 14, currentY);
  currentY += 6.5;

  doc.text("Cara Pembayaran :", 14, currentY);
  currentY += 6;

  // Step 1
  doc.text("1.", 19, currentY);
  doc.text("Transfer via ATM/Bank", 25, currentY);
  currentY += 4.8;
  const bankLine = doc.splitTextToSize(
    `Bank ${inv.bank.bankName} No. Rekening ${inv.bank.accountNumber} atas nama ${inv.bank.accountHolder}`,
    168
  );
  doc.text(bankLine, 25, currentY);
  currentY += bankLine.length * 4.5 + 1;

  // Step 2
  doc.text("2.", 19, currentY);
  const step2Lines = doc.splitTextToSize(
    "Cantumkan keterangan / berita Transfer dengan memasukkan Nomor Invoice diatas",
    168
  );
  doc.text(step2Lines, 25, currentY);
  currentY += step2Lines.length * 4.5 + 1;

  // Step 3
  doc.text("3.", 19, currentY);
  const prefix3 = "Kirim Bukti Transfer ke email ";
  const emailAddr = "finance@creativabridging.com";
  doc.text(prefix3, 25, currentY);
  const emailX = 25 + doc.getTextWidth(prefix3);
  doc.setTextColor(29, 78, 216);
  doc.text(emailAddr, emailX, currentY);
  const emailW = doc.getTextWidth(emailAddr);
  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.25);
  doc.line(emailX, currentY + 0.6, emailX + emailW, currentY + 0.6);

  currentY += 9;
  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text("Terimakasih telah bergabung dengan LPK CREATIVA", 14, currentY);

  currentY += 9.5;
  doc.text("LPK CREATIVA Team", 14, currentY);
  doc.text("https://creativabridging.com/", 14, currentY + 4.8);
  doc.text("Telp/SMS/WA +81 80-7948-7205", 14, currentY + 9.6);

  currentY += 17;
  doc.text("Diketahui Oleh,", 14, currentY);
  currentY += 2;

  const stampUrl = createDirectorStampDataURL();
  if (stampUrl) {
    try {
      doc.addImage(stampUrl, "PNG", 14, currentY, 52, 20.5);
    } catch {
      // Fallback spacing when image rendering is unavailable
    }
  }

  currentY += 25;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39);
  doc.text("Siti Nurhatifah", 14, currentY);
  doc.text("Direktur", 14, currentY + 4.8);

  if (mode === "preview") {
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl, "_blank");
    return blobUrl;
  }

  doc.save(`${inv.id || "INVOICE"}.pdf`);
}

export function previewInvoicePDF(inv) {
  return generateInvoicePDF(inv, 'preview');
}

// ─── HELPER: Terbilang Angka ke Bahasa Indonesia ──────────────────────────────
export function terbilangRupiah(angka) {
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  angka = Math.floor(Math.abs(Number(angka) || 0));
  if (angka === 0) return 'Nol Rupiah';

  function sebut(n) {
    if (n < 12) return bilangan[n];
    if (n < 20) return sebut(n - 10) + ' Belas';
    if (n < 100) return sebut(Math.floor(n / 10)) + ' Puluh ' + sebut(n % 10);
    if (n < 200) return 'Seratus ' + sebut(n - 100);
    if (n < 1000) return sebut(Math.floor(n / 100)) + ' Ratus ' + sebut(n % 100);
    if (n < 2000) return 'Seribu ' + sebut(n - 1000);
    if (n < 1000000) return sebut(Math.floor(n / 1000)) + ' Ribu ' + sebut(n % 1000);
    if (n < 1000000000) return sebut(Math.floor(n / 1000000)) + ' Juta ' + sebut(n % 1000000);
    if (n < 1000000000000) return sebut(Math.floor(n / 1000000000)) + ' Milyar ' + sebut(n % 1000000000);
    return sebut(Math.floor(n / 1000000000000)) + ' Triliun ' + sebut(n % 1000000000000);
  }

  return (sebut(angka).replace(/\s+/g, ' ').trim() + ' Rupiah');
}


// ─── TEMPLATES FOR INCLUDE, EXCLUDE & NOTES ─────────────────────────────────────
function InvoiceDetailModal({ inv, onClose, onPaymentProofSaved, onOpenPaymentModal }) {
  const [showBuktiModal, setShowBuktiModal] = useState(false);
  const stNorm = normalizeFinanceStatus(inv.status);
  const totalVal = Number(inv.total) || 0;
  const terbayarVal = Number(inv.terbayar) || 0;
  const sisaVal = Math.max(0, totalVal - terbayarVal);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-violet-200 text-xs font-semibold mb-0.5">Detail Invoice</p>
              <h3 className="text-white text-xl font-black">{inv.id}</h3>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status badge & Financial summary */}
          <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${STATUS_INV[inv.status] || "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
              {(inv.status === "Lunas" || inv.status === "Paid") && <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />}
              {(inv.status === "Sebagian" || inv.status === "Partially Paid") && <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-600" />}
              {(inv.status === "Belum Lunas" || inv.status === "Unpaid") && <XCircle className="w-3.5 h-3.5 mr-1.5 text-rose-600" />}
              {inv.status === "Paid" ? "Paid ✓" : inv.status}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {inv.program || "Kelas Intensif Offline"}
            </span>
          </div>

          {/* Detail rows */}
          <div className="px-6 py-4 flex flex-col gap-3">
            {[
              { icon: Building2, label: "Siswa / Customer", value: inv.customer },
              { icon: CalendarDays, label: "Tanggal Invoice", value: inv.tanggal },
              { icon: Clock, label: "Jatuh Tempo", value: inv.jatuhTempo || "-" },
              { icon: Banknote, label: "Total Tagihan", value: formatRp(inv.total), highlight: true },
              { icon: Tag, label: "Keterangan Program", value: inv.keterangan || inv.program || "Kelas Pelatihan Bahasa Jepang" },
            ].map(({ icon: Icon, label, value, highlight }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400 font-semibold mb-0.5">{label}</p>
                  <p className={`text-sm font-bold ${highlight ? "text-violet-700 text-base" : "text-slate-700"}`}>{value}</p>
                </div>
              </div>
            ))}

            {/* Financial breakdown for installment/fullpayment */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-center mt-1">
              <div>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Sudah Terbayar</span>
                <p className="text-xs font-extrabold text-emerald-700 mt-0.5">{formatRp(terbayarVal)}</p>
              </div>
              <div>
                <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Sisa Tagihan</span>
                <p className="text-xs font-extrabold text-rose-600 mt-0.5">{formatRp(sisaVal)}</p>
              </div>
            </div>

            {/* Tombol Lihat Bukti Transfer jika sudah pernah bayar atau Paid */}
            {(terbayarVal > 0 || stNorm === "Paid" || stNorm === "Partially Paid") && (
              <button
                type="button"
                onClick={() => setShowBuktiModal(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center justify-center gap-2 border border-indigo-200 cursor-pointer shadow-2xs"
              >
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>Lihat Foto Bukti Transfer ({stNorm === "Paid" ? "Full Payment / Pelunasan" : "Cicilan Termin"})</span>
              </button>
            )}
          </div>

          <div className="px-6 pb-5 flex gap-2">
            <button onClick={() => generateInvoicePDF(inv)} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition flex items-center justify-center gap-2 shadow-sm shadow-violet-200 cursor-pointer">
              <Printer className="w-4 h-4" /> Cetak / Unduh PDF
            </button>
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition cursor-pointer">
              Tutup
            </button>
          </div>
        </div>
      </div>

      {showBuktiModal && (
        <RiwayatBuktiInvoiceModal
          inv={inv}
          onClose={() => setShowBuktiModal(false)}
          onPaymentProofSaved={onPaymentProofSaved}
          onOpenPaymentModal={onOpenPaymentModal}
        />
      )}
    </>
  );
}

// ─── VIEW MODAL: Invoice Terkirim ─────────────────────────────────────────────
function TerkirimDetailModal({ item, onClose, onRefresh }) {

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-semibold mb-0.5">Detail Pengiriman Invoice</p>
            <h3 className="text-white text-xl font-black">{item.id}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${STATUS_KIRIM[item.statusKirim] || "bg-emerald-100 text-emerald-700"}`}>
              {item.statusKirim === "Terkirim" ? <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 mr-1 text-red-600" />}
              {item.statusKirim || "Belum tersedia"}
            </span>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${STATUS_BACA[item.statusBaca] || "bg-blue-50 text-blue-700"}`}>
              {item.statusBaca || "Belum tersedia"}
            </span>
          </div>
          {item.statusInvoice && (
            <span className="text-xs font-bold text-slate-500">
              Status Tagihan: <strong className="text-slate-800">{item.statusInvoice}</strong>
            </span>
          )}
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          {item.email_attempt_id && <p className="text-xs text-slate-500">Percobaan #{item.email_attempt_id}. SMTP Accepted berarti diterima SMTP; status inbox dan baca belum diketahui. {item.error_message}</p>}
          {!item.email_attempt_id && <p className="text-xs text-slate-500">Record kanal legacy/otomasi. Bukan bukti penerimaan SMTP PHP.</p>}
          {[
            { icon: Building2, label: "Siswa / Customer", value: item.customer },
            { icon: CalendarDays, label: "Tanggal Kirim", value: item.tglKirim },
            { icon: item.kanal === "Email" ? Mail : MessageCircle, label: "Kanal Pengiriman", value: item.kanal },
            { icon: User, label: "Penerima (Kontak)", value: item.penerima },
            ...(item.nominal ? [{ icon: Banknote, label: "Nominal Tagihan", value: formatRp(item.nominal), highlight: true }] : []),
          ].map(({ icon: Icon, label, value, highlight }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold mb-0.5">{label}</p>
                <p className={`text-sm font-bold ${highlight ? "text-blue-700 text-base" : "text-slate-800"}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 pb-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => previewInvoicePDF(item.invoice || { id: item.noInv || item.id })}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-200 cursor-pointer"
          >
            <Eye className="w-4 h-4" /> Buka Invoice PDF
          </button>
          <InvoiceEmailButton invoiceId={item.noInv || item.id} recipient={item.invoice?.email} latestAttempt={item.invoice?.email_delivery} resend onRefresh={async () => { onClose(); await onRefresh(); }} />
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL PREVIEW BUKTI TRANSFER (FULL IMAGE LIGHTBOX) ──────────────────────
function BuktiTransferModal({ payment, invoice, onClose }) {
  const [proofLoadError, setProofLoadError] = useState(false);
  if (!payment && !invoice) return null;

  const invObj = invoice || {
    id: payment?.noInv,
    customer: payment?.customer,
    program: "Kelas Pelatihan Bahasa Jepang",
    total: Number(payment?.jumlah || 0) + Number(payment?.sisa || 0)
  };

  const payObj = payment || invObj?.lastPayment || invObj?.payments?.at(-1);
  if (!payObj) return <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-6"><div className="bg-white rounded-2xl p-6"><p>Belum ada record pembayaran server untuk invoice ini.</p><button onClick={onClose} className="mt-4 text-blue-600">Tutup</button></div></div>;

  const buktiSrc = payObj.buktiBayar || payObj.buktiFoto || payObj.buktiBayarUrl || "";
  const buktiMime = payObj.proof_mime || payObj.buktiMime || "";
  const isPdf = isPdfProof(buktiSrc, buktiMime);

  const handleDownloadBukti = () => {
    if (!buktiSrc) return;
    const a = document.createElement("a");
    a.href = buktiSrc;
    a.download = `bukti-transfer-${invObj.id}-${payObj.receiptNo || 'transfer'}.${isPdf ? 'pdf' : 'jpg'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Bukti Transfer Pembayaran</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${buktiSrc ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-200 border-amber-500/30"}`}>
                  {buktiSrc ? <><CheckCircle className="w-3 h-3" /> Bukti Tersimpan</> : <><AlertCircle className="w-3 h-3" /> Belum Ada File Bukti</>}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Invoice #{invObj.id} &bull; {invObj.customer}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs bg-slate-50/50">
          {/* Card Info Pembayaran */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Jenis Pembayaran</span>
              <p className="font-bold text-slate-800 text-xs mt-0.5">
                {payObj.terminName || (Number(invObj.sisa) > 0 ? "Cicilan" : "Full Payment")}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Jumlah Transfer</span>
              <p className="font-extrabold text-emerald-700 text-xs mt-0.5">
                {formatRp(Number(payObj.jumlah || 0))}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Waktu Bayar</span>
              <p className="font-bold text-slate-800 text-xs mt-0.5">
                {payObj.tglBayar} {payObj.jamBayar ? `• ${payObj.jamBayar}` : ""}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">No. Referensi</span>
              <p className="font-mono font-bold text-slate-700 text-xs mt-0.5 truncate">
                {payObj.refNumber || "Belum tersedia"}
              </p>
            </div>
          </div>

          {/* Area Foto Bukti Transfer */}
          <div className="bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-center min-h-[360px] border border-slate-800 relative group overflow-hidden shadow-inner">
            {!buktiSrc || proofLoadError ? (
              <div className="px-6 text-center text-slate-300">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-70" />
                <p className="font-semibold">Foto bukti belum tersedia</p>
                <p className="text-[11px] mt-1 text-slate-400">File bukti lama mungkin belum tersimpan atau tidak dapat dibuka.</p>
              </div>
            ) : isPdf ? (
              <iframe src={buktiSrc} title="Dokumen bukti pembayaran" className="w-full h-[460px] rounded-lg bg-white" onError={() => setProofLoadError(true)} />
            ) : (
              <img
                src={buktiSrc}
                alt="Foto Bukti Transfer"
                className="max-h-[460px] w-auto max-w-full rounded-lg object-contain shadow-2xl transition duration-300"
                onError={() => setProofLoadError(true)}
              />
            )}
            {buktiSrc && !proofLoadError && (
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <a
                  href={buktiSrc}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 border border-white/20 transition cursor-pointer"
                  title="Buka bukti pembayaran di tab baru"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka Tab Baru
                </a>
              </div>
            )}
          </div>

          {/* Keterangan & Rekening Tujuan */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-600 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Rekening Tujuan:</span>
              <span className="font-bold text-slate-800">{payObj.rekening || "Belum tersedia"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Petugas Finance Approval:</span>
              <span className="font-bold text-emerald-700">{payObj.approverName || "Belum tersedia"}</span>
            </div>
            {payObj.catatan && (
              <div className="pt-1.5 border-t border-slate-100 flex items-start gap-2">
                <span className="font-semibold text-slate-500 shrink-0">Catatan:</span>
                <span className="text-slate-700 italic">{payObj.catatan}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          {buktiSrc && !proofLoadError && (
            <button
              type="button"
              onClick={handleDownloadBukti}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" /> Unduh Bukti
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL RIWAYAT PEMBAYARAN & BUKTI TRANSFER (UNTUK CICILAN & FULL PAYMENT) ───
function RiwayatBuktiInvoiceModal({ inv, onClose, onOpenPaymentModal, onPaymentProofSaved }) {
  const [selectedPaymentForBukti, setSelectedPaymentForBukti] = useState(null);
  const [uploadingPaymentId, setUploadingPaymentId] = useState(null);

  const handleProofUpload = async (payment, file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      Swal.fire({ icon: "error", title: "Format Tidak Didukung", text: "Gunakan foto JPG, PNG, WebP, atau dokumen PDF." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: "error", title: "File Terlalu Besar", text: "Ukuran bukti maksimal 5 MB." });
      return;
    }

    setUploadingPaymentId(String(payment.id));
    try {
      const formData = new FormData();
      formData.append("action", "attach_payment_proof");
      formData.append("payment_id", String(payment.id).replace(/^PAY-/, ""));
      formData.append("proof", file);
      const { data } = await axios.post("/api/billing.php", formData);
      if (data?.status !== "success" || !data?.data?.proof_url) {
        throw new Error(data?.message || "Bukti pembayaran gagal disimpan.");
      }

      const updatedPayment = {
        ...payment,
        buktiBayar: data.data.proof_url,
        proof_mime: data.data.proof_mime,
        buktiMime: data.data.proof_mime
      };
      onPaymentProofSaved?.(updatedPayment);
      Swal.fire({ icon: "success", title: "Bukti pembayaran tersimpan", timer: 1600, showConfirmButton: false });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Bukti gagal disimpan",
        text: error.response?.data?.message || error.message || "Silakan coba lagi."
      });
    } finally {
      setUploadingPaymentId(null);
    }
  };

  if (!inv) return null;

  const totalNominal = Number(inv.total || 0);
  const terbayarNominal = Number(inv.terbayar || 0);
  const sisaNominal = Number(inv.sisa ?? (totalNominal - terbayarNominal));

  // Kumpulkan list pembayaran yang sudah masuk
  const paymentsList = Array.isArray(inv.payments) ? inv.payments : [];

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 px-6 py-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs border border-white/20">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Riwayat & Bukti Pembayaran Invoice</h3>
                <p className="text-xs text-blue-100 font-mono">Invoice #{inv.id} &bull; {inv.customer}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
            {/* Banner Status Finansial */}
            <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Tagihan</span>
                <p className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5">{formatRp(totalNominal)}</p>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Sudah Terbayar</span>
                <p className="text-xs sm:text-sm font-extrabold text-emerald-600 mt-0.5">{formatRp(terbayarNominal)}</p>
              </div>
              <div>
                <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block">Sisa Tagihan</span>
                <p className="text-xs sm:text-sm font-extrabold text-rose-600 mt-0.5">{formatRp(sisaNominal)}</p>
              </div>
            </div>

            {/* Daftar Riwayat Cicilan & Bukti Transfer */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  Daftar Pembayaran & Bukti Transfer ({paymentsList.length} Transaksi):
                </span>
                {sisaNominal > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Masih Ada Sisa Tagihan
                  </span>
                )}
              </div>

              {paymentsList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-600">Belum Ada Riwayat Pembayaran</p>
                  <p className="text-[11px] text-slate-400 mt-1">Invoice ini berstatus Unpaid dan belum memiliki bukti transfer.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {paymentsList.map((p, idx) => {
                    const proofPaymentId = String(p.id || "").replace(/^PAY-/, "");
                    const canAttachProof = Boolean(onPaymentProofSaved) && /^\d+$/.test(proofPaymentId);
                    return (
                      <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Thumbnail Bukti Transfer */}
                          <div
                            onClick={() => setSelectedPaymentForBukti(p)}
                            className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative group/thumb cursor-pointer shrink-0 shadow-2xs"
                            title="Klik untuk perbesar bukti transfer"
                          >
                            <PaymentProofThumbnail payment={p} />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition text-white">
                              <ZoomIn className="w-4 h-4" />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">
                                {p.terminName || `Pembayaran #${idx + 1}`}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Disetujui ✓
                              </span>
                            </div>
                            <p className="text-emerald-700 font-extrabold text-sm mt-0.5">
                              {formatRp(Number(p.jumlah || 0))}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {p.tglBayar} {p.jamBayar ? `• ${p.jamBayar} WIB` : ""} &bull; Ref: <span className="font-mono">{p.refNumber || "Belum tersedia"}</span>
                            </p>
                          </div>
                        </div>

                        {/* Aksi Tombol Bukti Transfer & Kwitansi */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button type="button" onClick={() => openOfficialReceipt([p],inv.id)} className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs">Cetak Kwitansi Resmi</button>
                          {canAttachProof && (
                            <label className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200">
                              <UploadCloud className="w-3.5 h-3.5" />
                              {uploadingPaymentId === String(p.id) ? "Menyimpan..." : (p.buktiBayar || p.buktiFoto ? "Ganti Bukti" : "Upload Bukti")}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                className="hidden"
                                disabled={uploadingPaymentId !== null}
                                onChange={event => {
                                  const file = event.target.files?.[0];
                                  event.target.value = "";
                                  handleProofUpload(p, file);
                                }}
                              />
                            </label>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedPaymentForBukti(p)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-blue-200"
                          >
                            <ImageIcon className="w-3.5 h-3.5" /> Lihat Bukti Transfer
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            {sisaNominal > 0 && onOpenPaymentModal ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPaymentModal(inv);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <CreditCard className="w-4 h-4" /> Catat Pembayaran Cicilan Berikutnya
              </button>
            ) : <div />}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {selectedPaymentForBukti && (
        <BuktiTransferModal
          payment={selectedPaymentForBukti}
          invoice={inv}
          onClose={() => setSelectedPaymentForBukti(null)}
        />
      )}
    </>
  );
}

// ─── VIEW MODAL: Pembayaran ───────────────────────────────────────────────────
function PembayaranDetailModal({ item, onClose }) {
  const [showBuktiZoom, setShowBuktiZoom] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-semibold mb-0.5">Detail Pembayaran</p>
              <h3 className="text-white text-xl font-black">{item.noInv}</h3>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
          </div>
          <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${STATUS_VERIF[item.statusVerif]}`}>
              {item.statusVerif === "Terverifikasi" ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <Hourglass className="w-3.5 h-3.5 mr-1.5" />}
              {item.statusVerif}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {item.terminName || (item.sisa > 0 ? "Cicilan" : "Full Payment")}
            </span>
          </div>
          <div className="px-6 py-4 flex flex-col gap-3">
            {[
              { icon: Building2, label: "Customer / Siswa", value: item.customer },
              { icon: CalendarDays, label: "Tanggal Bayar", value: `${item.tglBayar} ${item.jamBayar ? ('• ' + item.jamBayar) : ''}` },
              { icon: CreditCard, label: "Metode Pembayaran", value: item.metode },
              { icon: Banknote, label: "Jumlah Bayar", value: formatRp(item.jumlah), highlight: true },
              { icon: Clock, label: "Sisa Tagihan", value: item.sisa === 0 ? "Lunas" : formatRp(item.sisa), hiRed: item.sisa > 0 },
            ].map(({ icon: Icon, label, value, highlight, hiRed }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5"><Icon className="w-4 h-4 text-slate-500" /></div>
                <div><p className="text-xs text-slate-400 font-semibold mb-0.5">{label}</p>
                  <p className={`text-sm font-bold ${highlight ? "text-emerald-700 text-base" : hiRed ? "text-red-600" : "text-slate-700"}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Kotak Bukti Transfer */}
          <div className="px-6 pb-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Foto Bukti Transfer:
                </span>
                <button
                  type="button"
                  onClick={() => setShowBuktiZoom(true)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" /> Perbesar Bukti
                </button>
              </div>
              <div
                onClick={() => setShowBuktiZoom(true)}
                className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-blue-400 transition"
              >
                <PaymentProofThumbnail payment={item} />
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-xs">{item.buktiBayar || item.buktiFoto ? "Bukti Transfer" : "Bukti Transfer Belum Tersedia"}</p>
                  <p className="text-[10px] text-slate-400">Klik untuk melihat bukti yang tersimpan</p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {item.statusVerif || "Status belum tersedia"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-5 space-y-2">
            <button
              type="button"
              onClick={() => {
                openOfficialReceipt([item], item.noInv);
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Receipt className="w-4 h-4" /> Cetak Kwitansi Resmi (Receipt PDF)
            </button>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition cursor-pointer">Tutup</button>
          </div>
        </div>
      </div>

      {showBuktiZoom && (
        <BuktiTransferModal
          payment={item}
          invoice={{ id: item.noInv, customer: item.customer, program: item.program || "Kelas Pelatihan Bahasa Jepang", total: Number(item.jumlah || 0) + Number(item.sisa || 0) }}
          onClose={() => setShowBuktiZoom(false)}
        />
      )}
    </>
  );
}

// ─── VIEW MODAL: Siswa ────────────────────────────────────────────────────────
function SiswaDetailModal({ item, onClose }) {
  const studentInvoices = item.invoices || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 flex items-center justify-between shrink-0">
          <div>
            <p className="text-violet-200 text-xs font-semibold mb-0.5">Detail Profil & Keuangan Siswa</p>
            <h3 className="text-white text-xl font-black">{item.nama}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${STATUS_SISWA[item.status] || "bg-slate-100 text-slate-700"}`}>{item.status}</span>
          <span className="text-xs font-bold text-slate-500">{item.program || "Kelas Intensif Offline"}</span>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Detail Informasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Hash, label: "ID Siswa", value: item.id },
              { icon: User, label: "PIC / Kontak", value: item.pic || "Siswa Mandiri" },
              { icon: Phone, label: "Telepon / WA", value: item.telp || "-" },
              { icon: Mail, label: "Email", value: item.email || "-" },
            ].map(({ icon: Icon, label, value }, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                  <Icon className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{label}</p>
                  <p className="text-xs font-bold text-slate-800 truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Kartu Ringkasan Finansial Tagihan */}
          <div className="p-3 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border border-violet-200">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Tagihan</span>
                <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{formatRp(item.total || 0)}</p>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 font-bold uppercase block">Terbayar</span>
                <p className="text-xs sm:text-sm font-black text-emerald-600 mt-0.5">{item.terbayar == null ? "Belum tersedia" : formatRp(item.terbayar)}</p>
              </div>
              <div>
                <span className="text-[10px] text-rose-600 font-bold uppercase block">Sisa Piutang</span>
                <p className="text-xs sm:text-sm font-black text-rose-600 mt-0.5">{item.sisa == null ? "Belum tersedia" : formatRp(item.sisa)}</p>
              </div>
            </div>
          </div>

          {/* Daftar Invoice Milik Siswa Ini */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-violet-600" />
                Daftar Invoice Terbit ({item.jmlInv || studentInvoices.length} Invoice):
              </span>
            </div>

            {studentInvoices.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                Siswa ini belum memiliki tagihan invoice aktif.
              </div>
            ) : (
              <div className="space-y-2">
                {studentInvoices.map((inv, idx) => {
                  const invStatus = normalizeFinanceStatus(inv.status);
                  return (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-600">#{inv.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${invStatus === "Paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            invStatus === "Partially Paid" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                              "bg-rose-50 text-rose-600 border border-rose-200"
                            }`}>
                            {invStatus}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-700 mt-1">
                          {formatRp(Number(inv.total) || 0)} &bull; <span className="text-slate-400 font-normal">{inv.tanggal}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => previewInvoicePDF(inv)}
                          title="Preview PDF"
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> PDF
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL CATAT & APPROVE PEMBAYARAN (FINANCE ADJUSTMENT) ──────────────────────
function CatatPembayaranModal({ inv, onClose, onApprove }) {
  const totalVal = Number(inv.total) || 0;
  const currentTerbayar = Number(inv.terbayar) || 0;
  const currentSisa = Math.max(0, totalVal - currentTerbayar);
  const hasInstallments = Array.isArray(inv.installments) && inv.installments.length > 0;

  // Find first unpaid termin
  const [selectedTerminIdx, setSelectedTerminIdx] = useState(() => {
    if (!hasInstallments) return null;
    let cum = currentTerbayar;
    for (let i = 0; i < inv.installments.length; i++) {
      const instNom = Number(inv.installments[i].nominal || 0);
      if (cum < instNom) return i;
      cum -= instNom;
    }
    return 0;
  });

  const [nominal, setNominal] = useState(() => {
    if (hasInstallments && selectedTerminIdx !== null && inv.installments[selectedTerminIdx]) {
      return Number(inv.installments[selectedTerminIdx].nominal || 0);
    }
    return currentSisa > 0 ? currentSisa : totalVal;
  });

  const [tglBayar, setTglBayar] = useState(() => new Date().toISOString().slice(0, 10));
  const [jamBayar, setJamBayar] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [approverName, setApproverName] = useState("FINANCE LPK CREATIVA");
  const [metode, setMetode] = useState("Transfer Bank BCA");
  const [rekening, setRekening] = useState(() => [inv.bank_name, inv.account_number, inv.account_holder].filter(Boolean).join(' / '));
  const [refNumber, setRefNumber] = useState("");
  const [catatan, setCatatan] = useState(() => {
    if (hasInstallments && selectedTerminIdx !== null && inv.installments[selectedTerminIdx]) {
      return `Pembayaran ${inv.installments[selectedTerminIdx].keterangan || ('Cicilan ke-' + (selectedTerminIdx + 1))} - No. Invoice ${inv.id}`;
    }
    return `Pelunasan tagihan program pelatihan ${inv.program || 'Bahasa Jepang'}`;
  });
  const [buktiPreview, setBuktiPreview] = useState(null);
  const [buktiFile, setBuktiFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isApprovedCheck, setIsApprovedCheck] = useState(true);
  const [isSuccessAnimated, setIsSuccessAnimated] = useState(false);
  const [previewBuktiItem, setPreviewBuktiItem] = useState(null);

  const pastPayments = Array.isArray(inv.payments) ? inv.payments : [];

  const handleSelectTermin = (idx, inst) => {
    setSelectedTerminIdx(idx);
    setNominal(Number(inst.nominal || 0));
    setCatatan(`Pembayaran ${inst.keterangan || ('Cicilan ke-' + (idx + 1))} - No. Invoice ${inv.id}`);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      Swal.fire({ icon: "error", title: "Format Tidak Didukung", text: "Gunakan foto JPG, PNG, WebP, atau dokumen PDF." });
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: "error", title: "File Terlalu Besar", text: "Ukuran bukti maksimal 5 MB." });
      e.target.value = "";
      return;
    }
    setBuktiFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBuktiPreview(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nominal || Number(nominal) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Nominal Belum Diisi",
        text: "Harap masukkan nominal pembayaran yang valid."
      });
      return;
    }

    const chosenTermin = (hasInstallments && selectedTerminIdx !== null) ? inv.installments[selectedTerminIdx] : null;

    setSubmitting(true);
    setIsApprovedCheck(true);

    try {
      const approved = await onApprove({
        nominal: Number(nominal),
        tglBayar,
        jamBayar,
        approverName: approverName.trim() || "FINANCE LPK CREATIVA",
        metode,
        rekening,
        refNumber,
        buktiBayarUrl: buktiPreview || "",
        buktiFile,
        catatan,
        terminIndex: chosenTermin ? (selectedTerminIdx + 1) : null,
        terminName: chosenTermin ? (chosenTermin.keterangan || `Cicilan ke-${selectedTerminIdx + 1}`) : null
      });
      if (approved === false) {
        setSubmitting(false);
        return;
      }
      setIsSuccessAnimated(true);
    } catch (error) {
      setSubmitting(false);
      setIsSuccessAnimated(false);
      Swal.fire({
        icon: "error",
        title: "Pembayaran Gagal Disimpan",
        text: error.response?.data?.message || error.message || "Pembayaran atau foto bukti gagal disimpan."
      });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs" onClick={onClose}>
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
          {/* Centang Sukses Overlay saat Approve diklik */}
          {isSuccessAnimated && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-xl ring-8 ring-emerald-50 animate-bounce">
                <Check className="w-12 h-12 stroke-[3]" />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
                <span>Pembayaran Berhasil Disetujui!</span>
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </h3>
              <p className="text-xs text-slate-600 font-medium max-w-sm mt-1.5 leading-relaxed">
                Pembayaran invoice <strong className="font-mono text-slate-800">#{inv.id}</strong> tersimpan. Saldo, receipt, dan hasil email mengikuti respons server.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 shadow-2xs">
                <Check className="w-4 h-4 text-emerald-600" /> Status pembayaran dimuat dari server
              </div>
            </div>
          )}

          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Catat & Approve Pembayaran (Finance)</h3>
                <p className="text-xs text-emerald-100 font-mono">Invoice #{inv.id} &bull; {inv.customer}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
            {/* Summary Banner */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Tagihan</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{formatRp(totalVal)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Sudah Terbayar</span>
                <p className="text-xs font-bold text-emerald-600 mt-0.5">{formatRp(currentTerbayar)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Sisa Tagihan</span>
                <p className="text-xs font-bold text-rose-600 mt-0.5">{formatRp(currentSisa)}</p>
              </div>
            </div>

            {/* Riwayat Pembayaran & Bukti Transfer Sebelumnya (Untuk Cicilan / Pembayaran Sebagian) */}
            {pastPayments.length > 0 && (
              <div className="p-3 bg-gradient-to-r from-amber-50/90 to-orange-50/80 rounded-xl border border-amber-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 text-[11px] flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-amber-600" /> Riwayat Bukti Pembayaran Sebelumnya ({pastPayments.length} Transaksi):
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                    Total Masuk: {formatRp(currentTerbayar)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {pastPayments.map((p, pIdx) => {
                    return (
                      <div key={pIdx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-amber-200 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <div
                            onClick={() => setPreviewBuktiItem(p)}
                            className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 overflow-hidden relative group/thumb cursor-pointer shrink-0"
                            title="Klik untuk melihat bukti transfer cicilan sebelumnya"
                          >
                            <PaymentProofThumbnail payment={p} sizeClass="w-10 h-10" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition text-white">
                              <ZoomIn className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-[11px] text-slate-800 flex items-center gap-1.5">
                              <span>{p.terminName || `Cicilan ke-${pIdx + 1}`}</span>
                              <span className="text-emerald-700 font-extrabold">{formatRp(p.jumlah)}</span>
                            </p>
                            <p className="text-[9.5px] text-slate-400">
                              {p.tglBayar} {p.jamBayar ? `• ${p.jamBayar} WIB` : ''} &bull; {p.metode}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewBuktiItem(p)}
                          className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10.5px] flex items-center gap-1 cursor-pointer transition border border-amber-200 shadow-2xs"
                        >
                          <ImageIcon className="w-3 h-3 text-amber-700" /> Lihat Bukti
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* JADWAL TERMIN CICILAN (JIKA SKEMA CICILAN) */}
            {hasInstallments && (
              <div className="space-y-2 p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 text-[11px] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> Jadwal Termin Pembayaran (Pilih Cicilan):
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold">{inv.installments.length} Total Termin</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {inv.installments.map((inst, idx) => {
                    const isSelected = selectedTerminIdx === idx;
                    const instNom = Number(inst.nominal || 0);
                    const prevSum = inv.installments.slice(0, idx).reduce((s, t) => s + Number(t.nominal || 0), 0);
                    const thisSum = prevSum + instNom;
                    const isPaid = currentTerbayar >= thisSum;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isPaid}
                        onClick={() => handleSelectTermin(idx, inst)}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${isPaid
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                          : isSelected
                            ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20"
                            : "bg-white border-blue-100 hover:border-blue-300 text-slate-700"
                          }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[11px]">{inst.keterangan || `Termin ${idx + 1}`}</span>
                            {isPaid && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 rounded font-bold">Lunas</span>}
                          </div>
                          <span className="text-[10px] text-slate-400">Jatuh Tempo: {inst.jatuhTempo || '-'}</span>
                        </div>
                        <span className="font-bold text-xs text-blue-700">{formatRp(instNom)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Nominal Bayar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700">Jumlah Pembayaran yang Disetujui (Rp) *</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNominal(currentSisa > 0 ? currentSisa : totalVal)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                  >
                    Bayar Lunas (100%)
                  </button>
                  {currentSisa > 0 && (
                    <button
                      type="button"
                      onClick={() => setNominal(Math.round(currentSisa / 2))}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer"
                    >
                      50% Sisa
                    </button>
                  )}
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  min="1000"
                  max={totalVal * 2}
                  value={nominal}
                  onChange={e => setNominal(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 italic">
                Terbilang: {terbilangRupiah(Number(nominal) || 0)}
              </p>
            </div>

            {/* Tanggal & Jam Bayar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tanggal Pembayaran *</label>
                <input
                  type="date"
                  value={tglBayar}
                  onChange={e => setTglBayar(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Jam Pembayaran / Approval *</label>
                <input
                  type="time"
                  value={jamBayar}
                  onChange={e => setJamBayar(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Nama Approver & Metode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Finance yang Approve *</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={e => setApproverName(e.target.value)}
                  placeholder="Contoh: FINANCE LPK CREATIVA"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Metode Pembayaran *</label>
                <select
                  value={metode}
                  onChange={e => setMetode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Transfer Bank BCA">Transfer Bank BCA</option>
                  <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                  <option value="Transfer Bank BNI">Transfer Bank BNI</option>
                  <option value="Transfer Bank BRI">Transfer Bank BRI</option>
                  <option value="Tunai / Kasir">Tunai / Kasir LPK</option>
                  <option value="QRIS / E-Wallet">QRIS / E-Wallet</option>
                </select>
              </div>
            </div>

            {/* Rekening Tujuan & No Referensi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Rekening Tujuan</label>
                <input
                  type="text"
                  value={rekening}
                  onChange={e => setRekening(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">No. Referensi Transfer / Struk</label>
                <input
                  type="text"
                  value={refNumber}
                  onChange={e => setRefNumber(e.target.value)}
                  placeholder="TRX-982348274 / Opsional"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Upload Bukti Pembayaran */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Upload Bukti Transfer / Pembayaran</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                {buktiPreview && (
                  <div className="shrink-0 relative group">
                    <div
                      onClick={() => setPreviewBuktiItem({
                        noInv: inv.id,
                        customer: inv.customer,
                        jumlah: nominal,
                        tglBayar,
                        jamBayar,
                        metode,
                        rekening,
                        refNumber,
                        buktiBayar: buktiPreview,
                        buktiMime: buktiFile?.type,
                        terminName: (hasInstallments && selectedTerminIdx !== null) ? inv.installments[selectedTerminIdx]?.keterangan : "Bukti Upload Baru",
                        catatan
                      })}
                      title="Klik untuk melihat bukti pembayaran"
                    >
                      <PaymentProofThumbnail payment={{ buktiBayar: buktiPreview, buktiMime: buktiFile?.type }} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewBuktiItem({
                        noInv: inv.id,
                        customer: inv.customer,
                        jumlah: nominal,
                        tglBayar,
                        jamBayar,
                        metode,
                        rekening,
                        refNumber,
                        buktiBayar: buktiPreview,
                        buktiMime: buktiFile?.type,
                        terminName: (hasInstallments && selectedTerminIdx !== null) ? inv.installments[selectedTerminIdx]?.keterangan : "Bukti Upload Baru",
                        catatan
                      })}
                      className="absolute inset-0 bg-black/40 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBuktiPreview(null);
                        setBuktiFile(null);
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-sm cursor-pointer z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Catatan / Keterangan */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Catatan Tambahan (Kwitansi / Audit)</label>
              <textarea
                rows={2}
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                placeholder="Catatan verifikasi finance..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Konfirmasi Persetujuan (Tanda Centang Approval) */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-emerald-900 select-none">
                <input
                  type="checkbox"
                  checked={isApprovedCheck}
                  onChange={e => setIsApprovedCheck(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                />
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Konfirmasi Approval: Bukti transfer valid & setujui penerimaan kas
                </span>
              </label>
              <p className="text-[11px] text-emerald-700 ml-6 mt-0.5">
                Saldo invoice dihitung server dari pembayaran terverifikasi. Hasil receipt dan pengiriman email dilaporkan terpisah.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-5 py-2.5 rounded-xl font-bold transition shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 ${isSuccessAnimated
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
              >
                {isSuccessAnimated ? (
                  <>
                    <Check className="w-4 h-4 text-white animate-bounce" />
                    <span>Telah Disetujui ✓</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve & Terbitkan Kwitansi (Receipt)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {previewBuktiItem && (
        <BuktiTransferModal
          payment={previewBuktiItem}
          invoice={inv}
          onClose={() => setPreviewBuktiItem(null)}
        />
      )}
    </>
  );
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────
function Pager({ page, totalPages, setPage, total, perPage }) {
  const start = Math.min((page - 1) * perPage + 1, total);
  const end = Math.min(page * perPage, total);
  const tp = Math.max(1, totalPages);
  const pages = Array.from({ length: Math.min(tp, 3) }, (_, i) => i + 1);
  return (
    <div className="px-4 py-3 flex items-center justify-between border-t border-slate-100 flex-wrap gap-2">
      <span className="text-xs text-slate-500 font-semibold">Menampilkan {start} - {end} dari {total} data</span>
      <div className="flex items-center gap-1">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map(n => (
          <button key={n} onClick={() => setPage(n)}
            className={`w-7 h-7 rounded-lg text-xs font-bold transition ${page === n ? "bg-violet-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {n}
          </button>
        ))}
        {tp > 3 && <span className="px-1 text-slate-400 text-xs">…</span>}
        {tp > 3 && <button onClick={() => setPage(tp)} className={`w-7 h-7 rounded-lg text-xs font-bold transition ${page === tp ? "bg-violet-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{tp}</button>}
        <button onClick={() => setPage(p => Math.min(tp, p + 1))} disabled={page === tp}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}


// ─── TAB 0: Daftar Invoice (MATCHING BLUEPRINT PANEL 1) ───────────────────────
function TabDaftarInvoice({ data = [], onDelete, dataSiswa = [], onRefresh, onApprovePayment, onPaymentProofSaved }) {
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [programFilter, setProgramFilter] = useState("Semua Program");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [viewItem, setViewItem] = useState(null);
  const [delItem, setDelItem] = useState(null);
  const [showBuat, setShowBuat] = useState(false);
  const [paymentModalInv, setPaymentModalInv] = useState(null);
  const [selectedBuktiInv, setSelectedBuktiInv] = useState(null);

  // Helper to open kwitansi / receipt
  const handleReceiptClick = inv => openOfficialReceipt(inv.payments || [], inv.id);

  const handleProofSaved = (updatedPayment) => {
    onPaymentProofSaved?.(updatedPayment);
    setSelectedBuktiInv(prev => prev ? {
      ...prev,
      payments: (prev.payments || []).map(payment => String(payment.id) === String(updatedPayment.id) ? updatedPayment : payment)
    } : prev);
  };

  // Invoice state is owned by the production API/database; never render demo defaults.
  const allInvoices = Array.isArray(data) ? data : [];

  // Calculate dynamic totals for KPI cards
  const totalNominal = allInvoices.reduce((acc, c) => acc + (Number(c.total) || 0), 0);

  const paidInvoices = allInvoices.filter(i => normalizeFinanceStatus(i.status) === "Paid");
  const paidNominal = paidInvoices.reduce((acc, c) => acc + (Number(c.total) || 0), 0);

  const partiallyPaidInvoices = allInvoices.filter(i => normalizeFinanceStatus(i.status) === "Partially Paid");
  const partiallyPaidNominal = partiallyPaidInvoices.reduce((acc, c) => acc + (Number(c.total) || 0), 0);

  const unpaidInvoices = allInvoices.filter(i => normalizeFinanceStatus(i.status) === "Unpaid");
  const unpaidNominal = unpaidInvoices.reduce((acc, c) => acc + (Number(c.total) || 0), 0);

  // Available programs for filter
  const programOptions = ["Semua Program", "Kelas Intensif Offline", "Program SSW", "Kursus Reguler"];
  const statusOptions = ["Semua Status", "Paid", "Partially Paid", "Unpaid", "Overdue"];

  // Filtered list
  const filtered = allInvoices.filter(inv => {
    const stNorm = normalizeFinanceStatus(inv.status);
    const matchesStatus = statusFilter === "Semua Status" || stNorm === statusFilter;

    const prg = inv.program || inv.keterangan || "";
    const matchesProgram =
      programFilter === "Semua Program" ||
      prg.toLowerCase().includes(programFilter.toLowerCase());

    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      (inv.id && inv.id.toLowerCase().includes(query)) ||
      (inv.customer && inv.customer.toLowerCase().includes(query)) ||
      (prg && prg.toLowerCase().includes(query));

    return matchesStatus && matchesProgram && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleDelete = (id) => {
    if (onDelete) onDelete(id);
    setDelItem(null);
    if (rows.length === 1 && page > 1) setPage(p => p - 1);
  };

  const handleDownload = (inv) => {
    generateInvoicePDF(inv);
  };

  return (
    <div className="space-y-6">
      {/* Buat Invoice Wizard Modal */}
      {showBuat && (
        <BuatInvoiceWizardModal
          onClose={() => setShowBuat(false)}
          onSuccess={() => {
            setShowBuat(false);
            if (onRefresh) onRefresh();
          }}
          dataSiswa={dataSiswa}
        />
      )}

      {/* Modal Catat & Approve Pembayaran (Finance Adjustment) */}
      {paymentModalInv && (
        <CatatPembayaranModal
          inv={paymentModalInv}
          onClose={() => setPaymentModalInv(null)}
          onApprove={async (payData) => {
            try {
              if (onApprovePayment) await onApprovePayment(paymentModalInv, payData);
              setPaymentModalInv(null);
            } catch (error) {
              Swal.fire({
                icon: "error",
                title: "Pembayaran gagal disimpan",
                text: error.response?.data?.message || error.message || "Status invoice tidak diubah. Silakan coba lagi."
              });
              return false;
            }
            return true;
          }}
        />
      )}

      {/* Modal Riwayat & Bukti Transfer Pembayaran */}
      {selectedBuktiInv && (
        <RiwayatBuktiInvoiceModal
          inv={selectedBuktiInv}
          onClose={() => setSelectedBuktiInv(null)}
          onPaymentProofSaved={handleProofSaved}
          onOpenPaymentModal={(inv) => {
            setSelectedBuktiInv(null);
            setPaymentModalInv(inv);
          }}
        />
      )}

      {/* View Detail Modal */}
      {viewItem && (
        <InvoiceDetailModal
          inv={viewItem}
          onClose={() => setViewItem(null)}
          onPaymentProofSaved={handleProofSaved}
          onOpenPaymentModal={(invoice) => {
            setViewItem(null);
            setPaymentModalInv(invoice);
          }}
        />
      )}

      {/* Confirm Delete Modal */}
      {delItem && (
        <ConfirmDeleteModal
          label={delItem.id}
          onConfirm={() => handleDelete(delItem.id)}
          onCancel={() => setDelItem(null)}
        />
      )}

      <div className="p-5 space-y-4">

        {/* ── FILTER TOOLBAR ── */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>01/08/2026 – 31/08/2026</span>
          </div>

          <select
            value={programFilter}
            onChange={e => { setProgramFilter(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            {programOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama siswa, no invoice..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
          </div>

          {(search || statusFilter !== "Semua Status" || programFilter !== "Semua Program") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("Semua Status");
                setProgramFilter("Semua Program");
                setPage(1);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Filter
            </button>
          )}
        </div>

        {/* ── TABLE DAFTAR INVOICE ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">No. Invoice</th>
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Siswa</th>
                  <th className="py-3.5 px-4">Program</th>
                  <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                  <th className="py-3.5 px-4 text-right">Terbayar</th>
                  <th className="py-3.5 px-4 text-right">Sisa</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 font-semibold">
                      Tidak ada data invoice yang sesuai kriteria filter.
                    </td>
                  </tr>
                ) : (
                  rows.map((inv, idx) => {
                    const rowNumber = (currentPage - 1) * perPage + idx + 1;
                    const totalVal = Number(inv.total) || 0;
                    const stNorm = normalizeFinanceStatus(inv.status);

                    const terbayarVal = Number(inv.terbayar) || 0;
                    const sisaVal = inv.sisa != null ? Number(inv.sisa) : Math.max(0, totalVal - terbayarVal);

                    return (
                      <tr
                        key={inv.id || idx}
                        className="hover:bg-blue-50/40 transition-colors group"
                      >
                        <td className="py-3.5 px-4 text-center font-bold text-slate-400">{rowNumber}</td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => previewInvoicePDF(inv)}
                            title="Buka Preview Invoice PDF"
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline tracking-wide font-mono text-xs"
                          >
                            {inv.id}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{inv.tanggal}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{inv.customer}<p className="text-xs font-normal text-slate-500">{inv.email || 'Email belum tersedia'}</p><p className="text-xs font-normal text-slate-500">Email: {inv.email_delivery?.status || 'Belum ada percobaan SMTP'}</p></td>
                        <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                          {inv.program || inv.keterangan || "Kelas Intensif Offline"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          {formatRp(totalVal)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                          {formatRp(terbayarVal)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold">
                          <span className={sisaVal > 0 ? "text-rose-600" : "text-slate-400"}>
                            {formatRp(sisaVal)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {stNorm === "Paid" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Paid
                            </span>
                          )}
                          {stNorm === "Partially Paid" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" /> Partially Paid
                            </span>
                          )}
                          {stNorm === "Unpaid" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                              Unpaid
                            </span>
                          )}
                          {stNorm === "Overdue" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-300">
                              Overdue
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Catat & Approve Pembayaran (Finance Adjustment) */}
                            {stNorm === "Paid" ? (
                              <button
                                type="button"
                                onClick={() => setPaymentModalInv(inv)}
                                title="Pembayaran Telah Disetujui (Approved ✓) - Klik untuk kelola pembayaran"
                                className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition cursor-pointer flex items-center justify-center shadow-2xs"
                              >
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPaymentModalInv(inv)}
                                title="Catat & Approve Pembayaran (Finance Adjustment)"
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                            )}

                            {/* Cetak Kwitansi Resmi (Receipt PDF) jika sudah ada pembayaran atau Paid */}
                            {(terbayarVal > 0 || stNorm === "Paid" || stNorm === "Partially Paid") && (
                              <button
                                type="button"
                                onClick={() => handleReceiptClick(inv)}
                                title="Cetak Kwitansi (Receipt PDF Resmi)"
                                className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 hover:text-teal-800 transition cursor-pointer"
                              >
                                <Receipt className="w-4 h-4" />
                              </button>
                            )}

                            {/* Tombol Lihat Bukti Transfer (Cicilan / Full Payment) */}
                            {(terbayarVal > 0 || stNorm === "Paid" || stNorm === "Partially Paid") && (
                              <button
                                type="button"
                                onClick={() => setSelectedBuktiInv(inv)}
                                title="Lihat Bukti Transfer & Riwayat Pembayaran (Cicilan / Full Payment)"
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 transition cursor-pointer"
                              >
                                <ImageIcon className="w-4 h-4" />
                              </button>
                            )}

                            {/* Portal Bayar QRIS & Status Kandidat Button */}
                            {inv.status_url && (
                              <button
                                type="button"
                                onClick={() => {
                                  const portalUrl = inv.status_url;
                                  if (navigator.clipboard?.writeText) {
                                    navigator.clipboard.writeText(portalUrl).catch(() => {});
                                  }
                                  Swal.fire({
                                    icon: "info",
                                    title: `Portal Bayar & Status (${inv.id})`,
                                    html: `<div style="font-size:12px;text-align:left;line-height:1.6;">
                                      <p style="margin-bottom:8px;">Tautan Portal Pembayaran QRIS / VA &amp; Status Pendaftaran telah disalin:</p>
                                      <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:8px;word-break:break-all;font-family:monospace;font-size:11px;">${portalUrl}</div>
                                    </div>`,
                                    confirmButtonText: "Buka Portal Kandidat",
                                    showCancelButton: true,
                                    cancelButtonText: "Tutup",
                                    confirmButtonColor: "#2563eb",
                                  }).then((res) => {
                                    if (res.isConfirmed) {
                                      window.open(portalUrl, "_blank", "noopener,noreferrer");
                                    }
                                  });
                                }}
                                title="Salin / Buka Portal Bayar QRIS & Status Kandidat"
                                className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-900 transition cursor-pointer"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                            )}

                            {/* Preview Invoice Eye Button */}
                            <InvoiceEmailButton invoiceId={inv.id} recipient={inv.email} latestAttempt={inv.email_delivery} onRefresh={onRefresh} />
                            <button
                              type="button"
                              onClick={() => previewInvoicePDF(inv)}
                              title="Preview Invoice (Buka PDF)"
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Unduh Invoice PDF Button */}
                            <button
                              type="button"
                              onClick={() => handleDownload(inv)}
                              title="Unduh PDF Resmi"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* Hapus Invoice Button */}
                            <button
                              type="button"
                              onClick={() => setDelItem(inv)}
                              title="Hapus Invoice"
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* ── TABLE FOOTER & PAGINATION ── */}
          <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <div>
              Menampilkan {filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} dari {filtered.length} data
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum)}
                      className={`w-8 h-8 rounded-lg font-bold text-xs transition ${currentPage === pNum
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <select
                value={perPage}
                onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
              >
                <option value={5}>5 / halaman</option>
                <option value={10}>10 / halaman</option>
                <option value={25}>25 / halaman</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 1: Invoice Terkirim ──────────────────────────────────────────────────
function TabInvoiceTerkirim({ data, onDelete, onRefresh }) {
  const [kanal, setKanal] = useState("Semua Kanal");
  const [status, setStatus] = useState("Semua Status");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewItem, setViewItem] = useState(null);
  const [delItem, setDelItem] = useState(null);
  const PER = 6;

  const filtered = data.filter(r =>
    (kanal === "Semua Kanal" || r.kanal === kanal) &&
    (status === "Semua Status" || r.statusKirim === status) &&
    (String(r.id ?? '').toLowerCase().includes(search.toLowerCase()) || String(r.customer ?? '').toLowerCase().includes(search.toLowerCase()))
  );
  const pages = Math.ceil(filtered.length / PER);
  const rows = filtered.slice((page - 1) * PER, page * PER);

  const handleDelete = (id) => {
    onDelete(id);
    setDelItem(null);
    if (rows.length === 1 && page > 1) setPage(p => p - 1);
  };
  const handleDownload = (item) => {
    downloadAsCSV(`${item.id}_terkirim.csv`,
      ["No Invoice", "Tanggal Kirim", "Customer", "Kanal", "Penerima", "Status Kirim", "Status Baca"],
      [[item.id, item.tglKirim, item.customer, item.kanal, item.penerima, item.statusKirim, item.statusBaca]]
    );
  };

  const stats = [
    { label: "SMTP Accepted", value: data.filter(row => row.statusKirim === "SMTP Accepted").length, sub: "Bukan bukti inbox / baca", ok: true, Icon: Send, bg: "bg-violet-100", ic: "text-violet-600" },
    { label: "Via Email", value: data.filter(d => d.kanal === "Email").length, sub: "Berdasarkan record server", ok: true, Icon: Mail, bg: "bg-blue-100", ic: "text-blue-600" },
    { label: "Via WhatsApp", value: data.filter(d => d.kanal === "WhatsApp").length, sub: "Berdasarkan record server", ok: true, Icon: MessageCircle, bg: "bg-emerald-100", ic: "text-emerald-600" },
    { label: "Gagal Kirim", value: data.filter(d => ["Gagal", "Failed"].includes(d.statusKirim)).length, sub: "Berdasarkan record server", ok: false, Icon: AlertTriangle, bg: "bg-red-100", ic: "text-red-500", vc: "text-red-500" },
  ];

  return (
    <>
      {viewItem && <TerkirimDetailModal item={viewItem} onClose={() => setViewItem(null)} onRefresh={onRefresh} />}
      {delItem && <ConfirmDeleteModal label={delItem.id} onConfirm={() => handleDelete(delItem.id)} onCancel={() => setDelItem(null)} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {stats.map(({ label, value, sub, ok, bg, ic, vc, Icon }, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">{label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}><Icon className={`w-4 h-4 ${ic}`} /></div>
            </div>
            <p className={`text-3xl font-black ${vc || "text-slate-800"} leading-tight`}>{value}</p>
            <p className={`text-[11px] mt-1.5 font-semibold flex items-center gap-1 ${ok ? "text-emerald-600" : "text-red-500"}`}>
              {ok ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{sub}
            </p>
          </div>
        ))}
      </div>

      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-semibold">Tanggal Kirim</label>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /><span>Sesuai riwayat server</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-semibold">Kanal Pengiriman</label>
          <select value={kanal} onChange={e => { setKanal(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300">
            {["Semua Kanal", "Email", "WhatsApp"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-semibold">Status Kirim</label>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300">
            {["Semua Status", "Pending", "SMTP Accepted", "Failed", "Terkirim", "Gagal"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-semibold">Status Baca</label>
          <select className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300">
            {["Semua Status", "Dibaca", "Pending"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label className="text-xs text-slate-500 font-semibold">Siswa</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari siswa..."
              className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
        </div>
        <button onClick={() => { setSearch(""); setKanal("Semua Kanal"); setStatus("Semua Status"); setPage(1); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
          <RefreshCw className="w-3.5 h-3.5" /> Reset Filter
        </button>
      </div>

      <p className="px-4 pt-4 pb-2 text-sm font-black text-slate-700">Daftar Invoice Terkirim</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["No. Invoice", "Tanggal Kirim", "Siswa", "Kanal", "Penerima", "Status Kirim", "Status Baca", "Aksi"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-slate-400 font-semibold">Tidak ada data</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.email_attempt_id ? `email-${r.email_attempt_id}` : r.id} className={`border-b border-slate-50 hover:bg-violet-50/50 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                <td className="px-4 py-3"><span className="text-violet-600 font-bold cursor-pointer hover:underline" onClick={() => setViewItem(r)}>{r.id}</span></td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.tglKirim}</td>
                <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{r.customer}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-slate-600 font-semibold">
                    {r.kanal === "Email" ? <Mail className="w-3.5 h-3.5 text-blue-500" /> : <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />}{r.kanal}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{r.penerima}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_KIRIM[r.statusKirim]}`}>
                    {r.statusKirim === "Terkirim" ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}{r.statusKirim}
                  </span>
                </td>
                <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_BACA[r.statusBaca]}`}>{r.statusBaca}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewItem(r)} title="Lihat Detail"
                      className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-500 hover:text-violet-600 transition"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => handleDownload(r)} title="Download CSV"
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition"><Download className="w-4 h-4" /></button>
                    {!r.email_attempt_id && <button onClick={() => setDelItem(r)} title="Hapus"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} totalPages={Math.max(1, pages)} setPage={setPage} total={filtered.length} perPage={PER} />
    </>
  );
}

// ─── TAB 2: Pembayaran ────────────────────────────────────────────────────────
function TabPembayaran({ data, onDelete, onRefresh, invoices, submissions }) {
  const [metode, setMetode] = useState("Semua Metode");
  const [status, setStatus] = useState("Semua Status");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewItem, setViewItem] = useState(null);
  const [delItem, setDelItem] = useState(null);
  const [selectedBuktiPay, setSelectedBuktiPay] = useState(null);
  const PER = 6;

  const filtered = data.filter(r =>
    (metode === "Semua Metode" || r.metode.toLowerCase().includes(metode.toLowerCase().replace("semua metode", ""))) &&
    (status === "Semua Status" || r.statusVerif === status) &&
    (String(r.noInv ?? '').toLowerCase().includes(search.toLowerCase()) || String(r.customer ?? '').toLowerCase().includes(search.toLowerCase()))
  );
  const pages = Math.ceil(filtered.length / PER);
  const rows = filtered.slice((page - 1) * PER, page * PER);

  const handleDelete = () => {
    onDelete(delItem.id);
    setDelItem(null);
    if (rows.length === 1 && page > 1) setPage(p => p - 1);
  };
  const handleDownload = (item) => {
    downloadAsCSV(`${item.noInv}_bayar.csv`,
      ["Tanggal Bayar", "No Invoice", "Customer", "Metode", "Jumlah", "Sisa", "Status"],
      [[item.tglBayar, item.noInv, item.customer, item.metode, formatRp(item.jumlah), formatRp(item.sisa), item.statusVerif]]
    );
  };

  const totalBayar = data.reduce((s, r) => s + Number(r.jumlah || 0), 0);
  const sudahVerif = data.filter(r => r.statusVerif === "Terverifikasi").reduce((s, r) => s + Number(r.jumlah || 0), 0);
  const menunggu = data.filter(r => r.statusVerif === "Menunggu").reduce((s, r) => s + Number(r.jumlah || 0), 0);
  const sisaPiutang = data.reduce((s, r) => s + Number(r.sisa || 0), 0);

  const stats = [
    { label: "Total Pembayaran", value: totalBayar, ok: true, sub: "Berdasarkan record server", Icon: CreditCard, bg: "bg-violet-100", ic: "text-violet-600" },
    { label: "Sudah Diverifikasi", value: sudahVerif, ok: true, sub: "Berdasarkan record server", Icon: ShieldCheck, bg: "bg-emerald-100", ic: "text-emerald-600", vc: "text-emerald-600" },
    { label: "Menunggu Verifikasi", value: menunggu, ok: false, sub: "Berdasarkan record server", Icon: Hourglass, bg: "bg-amber-100", ic: "text-amber-500", vc: "text-amber-600" },
    { label: "Sisa Piutang", value: sisaPiutang, ok: false, sub: "Berdasarkan record server", Icon: Clock, bg: "bg-red-100", ic: "text-red-500", vc: "text-red-500" },
  ];

  return (
    <>
      {selectedBuktiPay && (
        <BuktiTransferModal
          payment={selectedBuktiPay}
          invoice={{ id: selectedBuktiPay.noInv, customer: selectedBuktiPay.customer, program: selectedBuktiPay.program || "Kelas Pelatihan Bahasa Jepang", total: Number(selectedBuktiPay.jumlah || 0) + Number(selectedBuktiPay.sisa || 0) }}
          onClose={() => setSelectedBuktiPay(null)}
        />
      )}
      {viewItem && <PembayaranDetailModal item={viewItem} onClose={() => setViewItem(null)} />}
      {delItem && <ConfirmDeleteModal label={delItem.noInv} onConfirm={() => handleDelete()} onCancel={() => setDelItem(null)} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {stats.map(({ label, value, sub, ok, bg, ic, vc, Icon }, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">{label}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}><Icon className={`w-4 h-4 ${ic}`} /></div>
            </div>
            <p className={`text-xl font-black ${vc || "text-slate-800"} leading-tight`}>{formatRp(value)}</p>
            <p className={`text-[11px] mt-1.5 font-semibold flex items-center gap-1 ${ok ? "text-emerald-600" : "text-red-500"}`}>
              {ok ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{sub}
            </p>
          </div>
        ))}
      </div>

      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-semibold">Tanggal Bayar</label>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /><span>Sesuai record server</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-semibold">Siswa</label>
          <select className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300">
            <option>Semua Siswa</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-semibold">Metode Pembayaran</label>
          <select value={metode} onChange={e => { setMetode(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300">
            {["Semua Metode", "Transfer Bank", "QRIS", "Kartu Kredit", "Tunai"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-semibold">Status Verifikasi</label>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300">
            {["Semua Status", "Terverifikasi", "Menunggu"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <div className="relative mt-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari No. Invoice / Siswa"
              className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setSearch(""); setMetode("Semua Metode"); setStatus("Semua Status"); setPage(1); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
            <RefreshCw className="w-3.5 h-3.5" /> Reset Filter
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition shadow-sm shadow-violet-200">
            <Download className="w-3.5 h-3.5" /> Export Laporan
          </button>
        </div>
      </div>

      {submissions.filter(s=>!s.billing_payment_id).length>0 && <div className="p-4 space-y-3 border-b border-slate-100">
        <p className="text-sm font-bold">Bukti siswa untuk review ? belum menjadi pembayaran billing</p>
        {submissions.filter(s=>!s.billing_payment_id).map(s=><div key={s.id} className="rounded-xl border border-slate-200 p-3 space-y-2 text-xs">
          <p>Bukti siswa #{s.id} ? {s.invoice_id} ? {s.customer} ? {formatRp(s.amount)} ? {s.transfer_date} ? Referensi: {s.reference}</p>
          <p>Review akuntansi: {s.status}. {s.status!=='pending'?'Bukti sudah direview pada akuntansi; perlu rekonsiliasi sebelum dibuat sebagai pembayaran billing.':''}</p>
          <a href={s.proof_url} target="_blank" rel="noreferrer" className="text-blue-700 underline">Lihat bukti siswa #{s.id}</a>
          <PaymentReceiptActions payment={{submission_id:s.id,noInv:s.invoice_id,statusVerif:'Menunggu',proof_url:s.proof_url,accounting_reviewed:s.status!=='pending'}} recipient={s.email} onRefresh={onRefresh}/>
        </div>)}
      </div>}
      <p className="px-4 pt-4 pb-2 text-sm font-black text-slate-700">Daftar Pembayaran</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Tanggal Bayar", "No. Invoice", "Siswa", "Metode Pembayaran", "Jumlah Bayar", "Sisa Tagihan", "Status Verifikasi", "Aksi"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-slate-400 font-semibold">Tidak ada data</td></tr>
            ) : rows.map((r, i) => (
              <tr key={`${r.noInv}-${i}`} className={`border-b border-slate-50 hover:bg-violet-50/50 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.tglBayar}</td>
                <td className="px-4 py-3"><span className="text-violet-600 font-bold cursor-pointer hover:underline" onClick={() => setViewItem(r)}>{r.noInv}</span></td>
                <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{r.customer}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.metode}</td>
                <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{formatRp(r.jumlah)}</td>
                <td className="px-4 py-3 font-semibold whitespace-nowrap">{r.sisa === 0 ? <span className="text-slate-400">Rp 0</span> : <span className="text-amber-600">{formatRp(r.sisa)}</span>}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_VERIF[r.statusVerif]}`}>
                    {r.statusVerif === "Terverifikasi" ? <CheckCircle className="w-3 h-3 mr-1" /> : <Hourglass className="w-3 h-3 mr-1" />}{r.statusVerif}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSelectedBuktiPay(r)} title="Lihat Foto Bukti Transfer"
                      className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 transition cursor-pointer">
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <PaymentReceiptActions payment={r} recipient={invoices.find(inv=>String(inv.id)===String(r.noInv))?.email} onRefresh={onRefresh}/>
                    <button onClick={() => setViewItem(r)} title="Lihat Detail & Bukti"
                      className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-500 hover:text-violet-600 transition cursor-pointer"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => handleDownload(r)} title="Download CSV"
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition cursor-pointer"><Download className="w-4 h-4" /></button>
                    <button onClick={() => setDelItem(r)} title="Hapus"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} totalPages={Math.max(1, pages)} setPage={setPage} total={filtered.length} perPage={PER} />
    </>
  );
}

// ─── TAB 3: Siswa ─────────────────────────────────────────────────────────────
function TabSiswa({ data, onDelete }) {
  const [statusF, setStatusF] = useState("Semua Status");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewItem, setViewItem] = useState(null);
  const [delItem, setDelItem] = useState(null);
  const PER = 6;

  const filtered = data.filter(r =>
    (statusF === "Semua Status" || r.status === statusF) &&
    (r.nama.toLowerCase().includes(search.toLowerCase()) || r.pic.toLowerCase().includes(search.toLowerCase()))
  );
  const pages = Math.ceil(filtered.length / PER);
  const rows = filtered.slice((page - 1) * PER, page * PER);

  const handleDelete = (id) => {
    onDelete(id);
    setDelItem(null);
    if (rows.length === 1 && page > 1) setPage(p => p - 1);
  };
  const handleDownload = (item) => {
    downloadAsCSV(`${item.id}_siswa.csv`,
      ["ID", "Nama", "PIC", "Telepon", "Email", "Jml Invoice", "Total Tagihan", "Status"],
      [[item.id, item.nama, item.pic, item.telp, item.email, item.jmlInv, formatRp(item.total), item.status]]
    );
  };

  const totalCount = data.length || 1;
  const aktifCount = data.filter(d => d.status === "Aktif").length;
  const prioritasCount = data.filter(d => d.status === "Prioritas").length;
  const menunggakCount = data.filter(d => d.status === "Menunggak").length;
  const baruCount = data.filter(d => d.status === "Baru").length;

  const donutData = [
    { label: "Aktif", count: aktifCount, pct: Math.round(aktifCount / totalCount * 100), color: "#10b981" },
    { label: "Prioritas", count: prioritasCount, pct: Math.round(prioritasCount / totalCount * 100), color: "#8b5cf6" },
    { label: "Menunggak", count: menunggakCount, pct: Math.round(menunggakCount / totalCount * 100), color: "#ef4444" },
    { label: "Baru", count: baruCount, pct: Math.round(baruCount / totalCount * 100), color: "#3b82f6" },
  ];
  const donut = `conic-gradient(${donutData.map((d, i, a) => {
    const start = a.slice(0, i).reduce((s, x) => s + x.pct, 0);
    return `${d.color} ${start}% ${start + d.pct}%`;
  }).join(", ")})`;
  const top5 = [...data].sort((a, b) => (b.total || 0) - (a.total || 0)).slice(0, 5);

  const totalPiutangSiswa = data.every(row => row.sisa != null) ? data.reduce((sum, row) => sum + Number(row.sisa), 0) : null;
  const siswaBerpiutangCount = data.filter(d => (d.sisa || 0) > 0).length;

  return (
    <>
      {viewItem && <SiswaDetailModal item={viewItem} onClose={() => setViewItem(null)} />}
      {delItem && <ConfirmDeleteModal label={delItem.nama} onConfirm={() => handleDelete(delItem.id)} onCancel={() => setDelItem(null)} />}

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {[
              { label: "Total Siswa", value: data.length, sub: "Berdasarkan record server", ok: true, Icon: Users, bg: "bg-violet-100", ic: "text-violet-600", money: false },
              { label: "Siswa Aktif", value: aktifCount, sub: `${Math.round(aktifCount / totalCount * 100)}% dari total siswa`, ok: true, Icon: CheckCircle, bg: "bg-emerald-100", ic: "text-emerald-600", money: false },
              { label: "Siswa Baru", value: baruCount, sub: "Berdasarkan record server", ok: true, Icon: User, bg: "bg-blue-100", ic: "text-blue-600", money: false },
              { label: "Piutang Siswa", value: totalPiutangSiswa, sub: totalPiutangSiswa == null ? 'Saldo siswa belum tersedia dari server' : `${siswaBerpiutangCount} siswa memiliki sisa tagihan`, ok: totalPiutangSiswa === 0, Icon: Clock, bg: "bg-red-100", ic: "text-red-500", money: true, vc: "text-red-500" },
            ].map(({ label, value, sub, ok, bg, ic, vc, money, Icon }, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500">{label}</span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}><Icon className={`w-4 h-4 ${ic}`} /></div>
                </div>
                <p className={`${money ? "text-xl" : "text-3xl"} font-black ${vc || "text-slate-800"} leading-tight`}>{value == null ? "Belum tersedia" : money ? formatRp(value) : value}</p>
                <p className={`text-[11px] mt-1.5 font-semibold flex items-center gap-1 ${ok ? "text-emerald-600" : "text-red-500"}`}>
                  {ok ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{sub}
                </p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300">
              {["Semua Status", "Aktif", "Prioritas", "Menunggak", "Baru"].map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300">
              <option>Semua Kategori</option>
            </select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Cari nama siswa, PIC, email..."
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <button onClick={() => { setSearch(""); setStatusF("Semua Status"); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Reset Filter
            </button>
          </div>

          {/* Table */}
          <p className="px-4 pt-4 pb-2 text-sm font-black text-slate-700">Daftar Siswa (Tersinkronisasi Invoice)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["ID Siswa", "Nama Siswa", "PIC / Kontak", "Email / WhatsApp", "Jml Invoice", "Total Tagihan", "Sisa Piutang", "Status", "Aksi"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-10 text-slate-400 font-semibold">Tidak ada data</td></tr>
                ) : rows.map((r, i) => (
                  <tr key={r.id || i} className={`border-b border-slate-50 hover:bg-violet-50/50 transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/30"}`}>
                    <td className="px-4 py-3 text-violet-600 font-bold font-mono">{r.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      <span className="cursor-pointer hover:text-violet-600 hover:underline" onClick={() => setViewItem(r)}>
                        {r.nama}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-700">{r.pic || 'Siswa Mandiri'}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{r.telp || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <p>{r.email || '-'}</p>
                      <p className="flex items-center gap-1 mt-0.5 text-emerald-600"><MessageCircle className="w-3 h-3" />{r.telp || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-extrabold ${r.jmlInv > 0 ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-400"}`}>
                        {r.jmlInv ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{r.total == null ? "—" : formatRp(r.total)}</td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap">
                      {r.sisa == null ? <span className="text-slate-400">Belum tersedia</span> : r.sisa > 0 ? (
                        <span className="text-rose-600">{formatRp(r.sisa)}</span>
                      ) : (
                        <span className="text-slate-400 font-normal">Rp 0 (Lunas)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_SISWA[r.status] || "bg-slate-100 text-slate-700"}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewItem(r)} title="Lihat Profil & Riwayat Tagihan Siswa"
                          className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-500 hover:text-violet-600 transition cursor-pointer"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleDownload(r)} title="Download CSV"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition cursor-pointer"><Download className="w-4 h-4" /></button>
                        <button onClick={() => setDelItem(r)} title="Hapus"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} totalPages={Math.max(1, pages)} setPage={setPage} total={filtered.length} perPage={PER} />
        </div>

        {/* Sidebar */}
        <div className="xl:w-64 flex flex-col gap-5 pb-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-sm font-black text-slate-800 mb-4">Ringkasan Siswa</h3>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div style={{ background: donut }} className="w-28 h-28 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <span className="text-xs font-black text-slate-700">{data.length}</span>
                  </div>
                </div>
              </div>
              <div className="w-full flex flex-col gap-2">
                {donutData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-slate-600 font-semibold flex-1">{d.label}</span>
                    <span className="font-black text-slate-700">{d.count} <span className="text-slate-400 font-normal">({d.pct}%)</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-sm font-black text-slate-800 mb-3">Top 5 Siswa <span className="text-slate-400 font-medium text-xs">(Tagihan)</span></h3>
            <div className="flex flex-col gap-3">
              {top5.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-400 w-4">{i + 1}.</span>
                  <span className="text-xs font-semibold text-slate-700 flex-1 leading-tight">{s.nama}</span>
                  <span className="text-xs font-black text-violet-600 whitespace-nowrap">{formatRp(s.total)}</span>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 transition py-2 border border-violet-100 rounded-xl hover:bg-violet-50">
              Lihat Semua Siswa <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── TAB 4: Riwayat RPA & Midtrans ────────────────────────────────────────────
const RPA_STAGE_LABELS = {
  phase1_delivery: { label: "Fase 1: Invoice WA/Email", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  phase2_receipt_trigger: { label: "Fase 2: Trigger Receipt", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  phase2_receipt: { label: "Fase 2: Receipt Terkirim", cls: "bg-teal-50 text-teal-700 border-teal-200" },
  phase2_installment_reminder: { label: "Fase 2: Reminder Cicilan H-3", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  phase3_snap_created: { label: "Fase 3: Link QRIS / VA Dibuat", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  phase3_midtrans_webhook: { label: "Fase 3: Webhook Midtrans", cls: "bg-violet-50 text-violet-700 border-violet-200" },
};

function TabRiwayatRpa({ logs = [], rpaStatus = {}, invoices = [], onRefresh }) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");

  const invoiceUrlMap = new Map();
  invoices.forEach((inv) => {
    if (inv?.id && inv?.status_url) invoiceUrlMap.set(String(inv.id), inv.status_url);
  });

  const filteredLogs = logs.filter((row) => {
    const matchesStage = stageFilter === "ALL" || String(row.stage || "") === stageFilter;
    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      String(row.invoice_id || "").toLowerCase().includes(q) ||
      String(row.recipient || "").toLowerCase().includes(q) ||
      String(row.stage || "").toLowerCase().includes(q) ||
      String(row.error_message || "").toLowerCase().includes(q);
    return matchesStage && matchesQuery;
  });

  const successCount = logs.filter((l) => ["terkirim", "success", "sudah lunas"].includes(String(l.status || "").toLowerCase())).length;
  const failCount = logs.filter((l) => ["gagal", "error", "failed"].includes(String(l.status || "").toLowerCase())).length;

  return (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className={`rounded-xl border p-3.5 ${rpaStatus.midtrans_enabled ? "bg-emerald-50/70 border-emerald-200" : "bg-amber-50/70 border-amber-200"}`}>
          <div className="text-[11px] font-bold uppercase text-slate-500">Gateway Midtrans QRIS/VA</div>
          <div className={`text-sm font-extrabold mt-1 ${rpaStatus.midtrans_enabled ? "text-emerald-700" : "text-amber-700"}`}>
            {rpaStatus.midtrans_enabled
              ? (rpaStatus.midtrans_is_production ? "Aktif (Production)" : "Aktif (Sandbox Test)")
              : "Belum Diaktifkan"}
          </div>
        </div>
        <div className={`rounded-xl border p-3.5 ${rpaStatus.n8n_receipt_configured ? "bg-emerald-50/70 border-emerald-200" : "bg-amber-50/70 border-amber-200"}`}>
          <div className="text-[11px] font-bold uppercase text-slate-500">Webhook Receipt (n8n Fase 2)</div>
          <div className={`text-sm font-extrabold mt-1 ${rpaStatus.n8n_receipt_configured ? "text-emerald-700" : "text-amber-700"}`}>
            {rpaStatus.n8n_receipt_configured ? "Terhubung" : "Belum Diatur"}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="text-[11px] font-bold uppercase text-slate-500">Log Eksekusi Sukses</div>
          <div className="text-lg font-extrabold text-emerald-600 mt-0.5">{successCount} Event</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="text-[11px] font-bold uppercase text-slate-500">Log Gagal / Perlu Cek</div>
          <div className={`text-lg font-extrabold mt-0.5 ${failCount > 0 ? "text-rose-600" : "text-slate-700"}`}>{failCount} Event</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari No. Invoice, penerima, pesan..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs font-semibold rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 focus:outline-none"
          >
            <option value="ALL">Semua Tahap RPA</option>
            <option value="phase1_delivery">Fase 1: Invoice WA/Email</option>
            <option value="phase2_receipt_trigger">Fase 2: Trigger Receipt</option>
            <option value="phase2_receipt">Fase 2: Receipt Terkirim</option>
            <option value="phase2_installment_reminder">Fase 2: Reminder Cicilan</option>
            <option value="phase3_snap_created">Fase 3: Link QRIS / VA</option>
            <option value="phase3_midtrans_webhook">Fase 3: Webhook Midtrans</option>
          </select>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Muat Ulang Log
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">No. Invoice</th>
              <th className="px-4 py-3">Tahap Otomasi</th>
              <th className="px-4 py-3">Kanal</th>
              <th className="px-4 py-3">Penerima / Ref</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Catatan / Error</th>
              <th className="px-4 py-3 text-right">Portal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  Belum ada log eksekusi RPA Fase 1–3 atau Midtrans webhook.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const stMeta = RPA_STAGE_LABELS[log.stage] || { label: log.stage || "Event", cls: "bg-slate-100 text-slate-700 border-slate-200" };
                const stLower = String(log.status || "").toLowerCase();
                const statusBadge = ["terkirim", "success", "sudah lunas"].includes(stLower)
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : ["gagal", "error", "failed"].includes(stLower)
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200";
                const portalHref = invoiceUrlMap.get(String(log.invoice_id || "")) || "";
                const detailOrder = log.detail?.order_id ? `Order: ${log.detail.order_id}` : (log.detail?.receipt_number ? `Receipt: ${log.detail.receipt_number}` : "");
                const noteText = log.error_message || detailOrder || "-";
                return (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">{log.created_at}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{log.invoice_id}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-bold ${stMeta.cls}`}>
                        {stMeta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 uppercase font-semibold text-slate-600">{log.channel}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{log.recipient || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-bold ${statusBadge}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[260px] truncate" title={noteText}>{noteText}</td>
                    <td className="px-4 py-3 text-right">
                      {portalHref ? (
                        <a
                          href={portalHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-bold"
                        >
                          <Link2 className="w-3.5 h-3.5" /> Portal
                        </a>
                      ) : "-"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SIDEBAR (tab 0 & 1) ──────────────────────────────────────────────────────
function Sidebar({ invoiceData = [] }) {
  const paidCount = invoiceData.filter(i => normalizeFinanceStatus(i.status) === "Paid").length;
  const partialCount = invoiceData.filter(i => normalizeFinanceStatus(i.status) === "Partially Paid").length;
  const unpaidCount = invoiceData.filter(i => normalizeFinanceStatus(i.status) === "Unpaid").length;
  const overdueCount = invoiceData.filter(i => normalizeFinanceStatus(i.status) === "Overdue").length;

  const total = invoiceData.length || 1;
  const pie = [
    { label: "Paid", pct: Math.round(paidCount / total * 100), color: "#10b981" },
    { label: "Partially Paid", pct: Math.round(partialCount / total * 100), color: "#f59e0b" },
    { label: "Unpaid", pct: Math.round(unpaidCount / total * 100), color: "#ef4444" },
    { label: "Overdue", pct: Math.round(overdueCount / total * 100), color: "#991b1b" },
  ];
  const donutGradient = (() => {
    let parts = [], cum = 0;
    pie.forEach(p => {
      if (p.pct > 0) {
        parts.push(`${p.color} ${cum}% ${cum + p.pct}%`);
        cum += p.pct;
      }
    });
    return parts.length > 0 ? `conic-gradient(${parts.join(", ")})` : 'conic-gradient(#e2e8f0 0% 100%)';
  })();

  // Top customers
  const topCustomer = (() => {
    const custs = {};
    invoiceData.forEach(i => {
      if (!custs[i.customer]) custs[i.customer] = 0;
      custs[i.customer] += parseFloat(i.total) || 0;
    });
    return Object.entries(custs)
      .map(([nama, amount]) => ({ nama, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((c, i) => ({
        ...c,
        color: i === 0 ? "text-blue-600" : i === 1 ? "text-amber-600" : i === 2 ? "text-emerald-600" : i === 3 ? "text-violet-600" : "text-rose-600"
      }));
  })();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4">
        <h3 className="text-xs font-bold text-slate-800 mb-3">Distribusi Invoice</h3>
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div style={{ background: donutGradient }} className="w-20 h-20 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center"><div className="w-14 h-14 bg-white rounded-full" /></div>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-[9px] font-bold text-slate-400">Total</span>
              <span className="text-xs font-bold text-slate-800 leading-none">{invoiceData.length}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-xs w-full">
            {pie.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <span className="text-slate-500 font-medium text-[11px]">{p.label}</span>
                </div>
                <span className="text-slate-800 font-bold text-[11px]">{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-800">Top Customer</h3>
          <span className="text-[10px] font-bold text-blue-600 cursor-pointer hover:underline">Lihat Semua</span>
        </div>
        <div className="flex flex-col gap-2">
          {topCustomer.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-slate-400 font-medium">Belum ada data</p>
            </div>
          ) : topCustomer.map((c, i) => (
            <div key={i} className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-blue-100 text-blue-600' : i === 1 ? 'bg-amber-100 text-amber-600' : i === 2 ? 'bg-emerald-100 text-emerald-600' : i === 3 ? 'bg-violet-100 text-violet-600' : 'bg-rose-100 text-rose-600'}`}>{i + 1}</div>
                <span className="text-slate-700 font-semibold truncate max-w-[120px]">{c.nama}</span>
              </div>
              <span className={`font-bold ${c.color}`}>{formatRp(c.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-800">Ringkasan Status</h3>
          <span className="text-[10px] font-bold text-blue-600 cursor-pointer hover:underline">Lihat Semua</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-semibold text-emerald-700">Paid</span>
            <span className="text-xs font-bold text-slate-800">{paidCount}</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-amber-50 border border-amber-100">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-semibold text-amber-700">Partial</span>
            <span className="text-xs font-bold text-slate-800">{partialCount}</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-rose-50 border border-rose-100">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="text-[10px] font-semibold text-rose-700">Unpaid</span>
            <span className="text-xs font-bold text-slate-800">{unpaidCount}</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-red-100/70 border border-red-200">
            <XCircle className="w-4 h-4 text-red-700" />
            <span className="text-[10px] font-semibold text-red-700">Overdue</span>
            <span className="text-xs font-bold text-slate-800">{overdueCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SYNCHRONIZE INVOICE TERKIRIM DENGAN DAFTAR INVOICE ──────────────────────
function syncTerkirimWithInvoices(currentInvoices, existingTerkirim = [], emailAttempts = []) {
  const emailRows = emailAttempts.map(attempt => ({ id: attempt.invoice_id, noInv: attempt.invoice_id, email_attempt_id: attempt.id,
    tglKirim: attempt.created_at, kanal: 'Email', penerima: attempt.recipient, statusKirim: attempt.status,
    statusBaca: 'Belum diketahui', error_message: attempt.error_message }));
  return serverDeliveryRows(currentInvoices, [...emailRows, ...existingTerkirim]).map(row => ({ ...row,
    invoice: currentInvoices.find(invoice => String(invoice.id) === String(row.noInv || row.id)),
    customer: row.customer || currentInvoices.find(invoice => String(invoice.id) === String(row.noInv || row.id))?.customer }));
}

// ─── SYNCHRONIZE PEMBAYARAN DENGAN DAFTAR INVOICE ─────────────────────────────
function syncPembayaranWithInvoices(currentInvoices, existingPayments = []) {
  return serverPaymentRows(currentInvoices, existingPayments);
}

// ─── SYNCHRONIZE SISWA DENGAN DAFTAR INVOICE & STUDENTS MASTER ────────────────
function syncSiswaWithInvoices(currentInvoices, baseSiswaList = []) {
  // Billing's mixed student list is display-only; the wizard fetches official accounting identities separately.
  return baseSiswaList.map(row => ({ ...row, nama: row.nama || row.name || '', pic: row.pic || row.affiliator || '',
    telp: row.telp || row.phone || row.no_wa || '', email: row.email || '', program: row.program || '',
    invoices: [], terbayar: row.terbayar ?? null, sisa: row.sisa ?? null }));
}

export default function InvoicePenagihan() {

  const [activeTab, setActiveTab] = useState(0);

  // Data State
  const [invoices, setInvoices] = useState([]);
  const [terkirim, setTerkirim] = useState([]);
  const [pembayaran, setPembayaran] = useState([]);
  const [siswa, setSiswa] = useState([]);
  const [automationLogs, setAutomationLogs] = useState([]);
  const [submissions,setSubmissions]=useState([]);
  const manualRequests=useRef(new Map());
  const [rpaStatus, setRpaStatus] = useState({});
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await axios.get('/api/billing.php');
      if (res.data.status === 'success' && ['invoices', 'terkirim', 'pembayaran', 'siswa'].every(k => Array.isArray(res.data.data?.[k]))) {
        const serverInvs = res.data.data.invoices || [];
        const serverPayments = res.data.data.pembayaran || [];
        const finalInvoices = serverInvs.map(invoice => ({
          ...invoice,
          payments: serverPayments.filter(payment => String(payment.noInv) === String(invoice.id))
        }));
        setInvoices(finalInvoices);
        setSubmissions(res.data.data.student_submissions || []);

        // 1. SINKRONISASI INVOICE TERKIRIM
        const syncedTerkirim = syncTerkirimWithInvoices(finalInvoices, res.data.data.terkirim || [], res.data.data.email_attempts || []);
        setTerkirim(syncedTerkirim);

        // 2. SINKRONISASI PEMBAYARAN
        const syncedPayments = syncPembayaranWithInvoices(finalInvoices, serverPayments);
        setPembayaran(syncedPayments);

        // 3. SINKRONISASI SISWA
        const syncedSiswa = syncSiswaWithInvoices(finalInvoices, res.data.data.siswa || []);
        setSiswa(syncedSiswa);

        setAutomationLogs(Array.isArray(res.data.data.automation_logs) ? res.data.data.automation_logs : []);
        setRpaStatus(res.data.data.rpa_status || {});
      } else throw new Error('Respons billing tidak valid.');
    } catch (e) {
      setLoadError(e.response?.data?.message || e.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    axios.get('/api/billing.php').then(({ data }) => {
      if (!active) return;
      if (data.status !== 'success' || !['invoices', 'terkirim', 'pembayaran', 'siswa'].every(k => Array.isArray(data.data?.[k]))) throw new Error('Respons billing tidak valid.');
      const serverInvs = data.data.invoices || [];
      const serverPayments = data.data.pembayaran || [];
      const finalInvoices = serverInvs.map(invoice => ({
        ...invoice,
        payments: serverPayments.filter(payment => String(payment.noInv) === String(invoice.id))
      }));
      setInvoices(finalInvoices);
      setSubmissions(data.data.student_submissions || []);

      // 1. SINKRONISASI INVOICE TERKIRIM
      const syncedTerkirim = syncTerkirimWithInvoices(finalInvoices, data.data.terkirim || [], data.data.email_attempts || []);
      setTerkirim(syncedTerkirim);

      // 2. SINKRONISASI PEMBAYARAN
      const syncedPayments = syncPembayaranWithInvoices(finalInvoices, serverPayments);
      setPembayaran(syncedPayments);

      // 3. SINKRONISASI SISWA
      const syncedSiswa = syncSiswaWithInvoices(finalInvoices, data.data.siswa || []);
      setSiswa(syncedSiswa);

      setAutomationLogs(Array.isArray(data.data.automation_logs) ? data.data.automation_logs : []);
      setRpaStatus(data.data.rpa_status || {});
    }).catch(error => { if (active) setLoadError(error.response?.data?.message || error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // ── APPROVE PAYMENT & REALIZATION SINKRONISASI ──
  const handleApprovePayment = async (inv, paymentData) => {
    const formData = new FormData();
    const requestId=manualRequests.current.get(String(inv.id)) || crypto.randomUUID();
    manualRequests.current.set(String(inv.id),requestId);
    formData.append('request_id',requestId);
    formData.append('action', 'approve_payment');
    formData.append('invoice_id', String(inv.id));
    formData.append('tglBayar', paymentData.tglBayar);
    formData.append('customer', inv.customer || paymentData.customer || '');
    formData.append('metode', paymentData.metode || 'Transfer Bank');
    formData.append('jumlah', String(paymentData.nominal || 0));
    if (paymentData.buktiFile) formData.append('proof', paymentData.buktiFile);

    let persistedPayment;
    try {
      persistedPayment=await reconcilePayment(requestId);
      if(!persistedPayment){
        const response=await axios.post('/api/billing.php',formData);
        if(response.data?.status!=='success' || response.data?.data?.payment_status!=='Verified')throw new Error(response.data?.message || 'Pembayaran belum dikonfirmasi.');
        persistedPayment=response.data.data;
      }
    } catch(error) {
      try { persistedPayment=await reconcilePayment(requestId); } catch { throw new Error('Hasil pembayaran belum pasti. Periksa server sebelum retry; request pembayaran tetap sama.'); }
      if(!persistedPayment){if(error.response?.status<500)manualRequests.current.delete(String(inv.id));throw error;}
    }
    manualRequests.current.delete(String(inv.id));
    await fetchData();
    await showPaymentResult(persistedPayment);
    return true;
  };

  const handlePaymentProofSaved = (updatedPayment) => {
    const updateInvoice = invoice => String(invoice.id) === String(updatedPayment.noInv)
      ? { ...invoice, payments: (invoice.payments || []).map(payment => String(payment.id) === String(updatedPayment.id) ? updatedPayment : payment) }
      : invoice;
    setInvoices(prev => prev.map(updateInvoice));
    setPembayaran(prev => prev.map(payment => String(payment.id) === String(updatedPayment.id) ? updatedPayment : payment));
  };

  const handleDelete = async (type, id) => {
    try {
      const { data } = await axios.delete(`/api/billing.php?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`);
      if (data?.status !== 'success') throw new Error(data?.message || 'Penghapusan belum dikonfirmasi server.');
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Data Belum Dihapus', text: error.response?.data?.message || error.message });
    }

    // 3. Re-sync data
    fetchData();
  };

  const [showBuatRoot, setShowBuatRoot] = useState(false);

  if (loading || loadError) return <Layout><div className="rounded-xl bg-white p-6"><p role={loadError ? 'alert' : 'status'}>{loadError || 'Memuat billing…'}</p>{loadError && <button onClick={fetchData}>Coba lagi</button>}</div></Layout>;

  const totalTagihan = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
  const paidInvs = invoices.filter(i => normalizeFinanceStatus(i.status) === "Paid");
  const paidNominal = paidInvs.reduce((s, i) => s + Number(i.total || 0), 0);
  const partInvs = invoices.filter(i => normalizeFinanceStatus(i.status) === "Partially Paid");
  const partNominal = partInvs.reduce((s, i) => s + Number(i.total || 0), 0);
  const unpaidInvs = invoices.filter(i => {
    const st = normalizeFinanceStatus(i.status);
    return st === "Unpaid" || st === "Overdue";
  });
  const unpaidNominal = unpaidInvs.reduce((s, i) => s + Number(i.total || 0), 0);

  return (
    <Layout>
      <div className="w-full space-y-5 font-sans">

        {/* ── TOP HEADER (BOOTSTRAP / LARAVEL STYLE) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
              <span>Dashboard</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span>Finance</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 font-semibold">Billing Invoice</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing Invoice</h1>
            <p className="text-xs text-slate-500 mt-0.5">Kelola data tagihan siswa, status pembayaran, dan riwayat invoice secara terpadu.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowBuatRoot(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Buat Invoice Baru
            </button>
          </div>
        </div>

        {/* ── UNIFIED 4 KPI METRIC CARDS (CLEAN BOOTSTRAP CARD STYLE) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Tagihan */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between hover:border-blue-300 transition">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Tagihan</span>
              <h3 className="text-xl font-bold text-slate-900">{formatRp(totalTagihan)}</h3>
              <span className="text-xs font-semibold text-blue-600">{invoices.length} Total Invoice</span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Paid (Lunas) */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between hover:border-emerald-300 transition">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lunas (Paid)</span>
              <h3 className="text-xl font-bold text-emerald-600">{formatRp(paidNominal)}</h3>
              <span className="text-xs font-semibold text-emerald-600">{paidInvs.length} Invoice Lunas</span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Partially Paid (Sebagian) */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between hover:border-amber-300 transition">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sebagian (Partial)</span>
              <h3 className="text-xl font-bold text-amber-600">{formatRp(partNominal)}</h3>
              <span className="text-xs font-semibold text-amber-600">{partInvs.length} Invoice Berjalan</span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Unpaid (Belum Lunas) */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between hover:border-rose-300 transition">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Belum Lunas (Unpaid)</span>
              <h3 className="text-xl font-bold text-rose-600">{formatRp(unpaidNominal)}</h3>
              <span className="text-xs font-semibold text-rose-600">{unpaidInvs.length} Menunggu Pembayaran</span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT CARD (FULL WIDTH BOOTSTRAP CARD WITH NAV TABS) ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Nav Tabs */}
          <div className="border-b border-slate-200 px-6 flex gap-6 overflow-x-auto bg-slate-50/50">
            {TABS.map((t, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${activeTab === i
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 0 && (
              <TabDaftarInvoice
                data={invoices}
                onDelete={(id) => handleDelete('invoice', id)}
                dataSiswa={siswa}
                onRefresh={fetchData}
                onApprovePayment={handleApprovePayment}
                onPaymentProofSaved={handlePaymentProofSaved}
              />
            )}
            {activeTab === 1 && <TabInvoiceTerkirim data={terkirim} onDelete={(id) => handleDelete('terkirim', id)} onRefresh={fetchData} />}
            {activeTab === 2 && <TabPembayaran data={pembayaran} onDelete={(id) => handleDelete('pembayaran', id)} onRefresh={fetchData} invoices={invoices} submissions={submissions} />}
            {activeTab === 3 && <div className="p-6"><TabSiswa data={siswa} onDelete={(id) => handleDelete('siswa', id)} /></div>}
            {activeTab === 4 && (
              <TabRiwayatRpa
                logs={automationLogs}
                rpaStatus={rpaStatus}
                invoices={invoices}
                onRefresh={fetchData}
              />
            )}
          </div>
        </div>

        {/* ── BOTTOM ANALYTICS ROW (DISTRIBUSI & STATUS) ── */}
        {(activeTab === 0 || activeTab === 1) && (
          <Sidebar invoiceData={invoices} />
        )}

        {/* Modal Buat Invoice (Root trigger) */}
        {showBuatRoot && (
          <BuatInvoiceWizardModal
            onClose={() => setShowBuatRoot(false)}
            onSuccess={() => {
              setShowBuatRoot(false);
              fetchData();
            }}
            dataSiswa={siswa}
          />
        )}
      </div>
    </Layout>
  );
}
