import { useState, useEffect, useCallback } from "react";

import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Layout from "../components/Layout";
import BuatInvoiceWizardModal from "../components/BuatInvoiceWizardModal";
import {
  Receipt, FileText, Send, CreditCard, BarChart2,
  TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle,
  XCircle, Search, RefreshCw, Plus, ChevronLeft, ChevronRight,
  Eye, Download, Trash2, Calendar, Users, User,
  ArrowUpRight, Wallet, Mail, MessageCircle, AlertTriangle,
  ShieldCheck, Hourglass, ArrowRight, Pencil, Phone, X,
  Building2, Hash, CalendarDays, Banknote, Tag, PieChart,
  Settings, CheckSquare, Square, Printer, Check, PlusCircle, Sparkles, HelpCircle
} from "lucide-react";

const formatRp = (n) => "Rp " + n.toLocaleString("id-ID");

export function normalizeFinanceStatus(status) {
  if (!status) return "Unpaid";
  const s = String(status).trim().toLowerCase();
  if (s === "lunas" || s === "paid") return "Paid";
  if (s === "sebagian" || s === "sebagian dibayar" || s === "partially paid" || s === "partial") return "Partially Paid";
  if (s === "overdue" || s === "lewat jatuh tempo" || s === "past due") return "Overdue";
  return "Unpaid";
}


const TABS = ["Daftar Invoice", "Invoice Terkirim", "Pembayaran", "Siswa"];

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────








// ─── STATUS STYLES ────────────────────────────────────────────────────────────
const STATUS_INV   = {
  "Paid": "bg-emerald-50 text-emerald-600 border border-emerald-200",
  "Partially Paid": "bg-amber-50 text-amber-600 border border-amber-200",
  "Unpaid": "bg-rose-50 text-rose-600 border border-rose-200",
  "Overdue": "bg-red-100 text-red-700 border border-red-300",
  "Lunas": "bg-emerald-50 text-emerald-600 border border-emerald-200",
  "Sebagian": "bg-amber-50 text-amber-600 border border-amber-200",
  "Belum Dibayar": "bg-rose-50 text-rose-600 border border-rose-200",
  "Belum Lunas": "bg-rose-50 text-rose-600 border border-rose-200"
};
const STATUS_KIRIM = { "Terkirim": "bg-emerald-100 text-emerald-700", "Gagal": "bg-red-100 text-red-600" };
const STATUS_BACA  = { "Dibaca": "bg-blue-100 text-blue-700", "Pending": "bg-amber-100 text-amber-700", "–": "bg-slate-100 text-slate-400" };
const STATUS_VERIF = { "Terverifikasi": "bg-emerald-100 text-emerald-700", "Menunggu": "bg-amber-100 text-amber-700" };
const STATUS_SISWA = { "Prioritas": "bg-violet-100 text-violet-700", "Aktif": "bg-emerald-100 text-emerald-700", "Menunggak": "bg-red-100 text-red-600", "Baru": "bg-blue-100 text-blue-700" };

// ─── DOWNLOAD HELPER ──────────────────────────────────────────────────────────
function downloadAsCSV(filename, headers, rows) {
  const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
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

// ─── HELPER: Generate & Download / Preview Official Invoice PDF ───────────────────────────
export function generateInvoicePDF(inv, mode = 'download') {
  const doc = new jsPDF({ format: 'a4' });
  doc.setFont("helvetica");
  doc.setProperties({
    title: `INVOICE - ${inv.id || 'INVOICE'} - ${(inv.customer || '').toUpperCase()}`
  });

  let currentY = 18;

  // 1. KOP SURAT RESMI
  if (inv.showKop !== false) {
    // Left: Logo
    if (inv.showLogo !== false) {
      try {
        const logoImg = new Image();
        logoImg.src = "/images/creativa-kop-logo.png";
        doc.addImage(logoImg, 'PNG', 14, 12, 50, 20);
      } catch (e) {
        doc.setTextColor(30, 58, 138);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(14);
        doc.text("CREATIVA BRIDGING", 14, 20);
        doc.text("INTERNATIONAL", 14, 26);
      }
    } else {
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(14);
      doc.text("CREATIVA BRIDGING", 14, 20);
      doc.text("INTERNATIONAL", 14, 26);
    }

    // Right: Kop Surat Teks
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text("INVOICE", 196, 18, { align: 'right' });

    doc.setFontSize(9.5);
    doc.text("PT. Creativa Bridging International", 196, 24, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text("Ruko Business Park, Jl. Ir. H. Juanda, Panembong, Ruko B1", 196, 29, { align: 'right' });
    doc.text("Mekarsari, Kec. Cianjur, Kab. Cianjur, Jawa Barat 43211", 196, 34, { align: 'right' });
    doc.text("+62 815-2222-672 | creativabridging.com", 196, 39, { align: 'right' });

    // Double Line Separator
    currentY = 44;
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.6);
    doc.line(14, currentY, 196, currentY);
    doc.setLineWidth(0.2);
    doc.line(14, currentY + 1.2, 196, currentY + 1.2);
    currentY += 8;
  }

  // 2. META DATA (To Customer & Invoice Info)
  const metaStartY = currentY;
  doc.setTextColor(0);
  doc.setFontSize(9.5);
  doc.setFont(undefined, 'normal');
  doc.text("To,", 14, metaStartY);

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(inv.customer ? inv.customer.toUpperCase() : "-", 14, metaStartY + 6);

  doc.setFontSize(8.5);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(90);
  if (inv.phone) doc.text(`Telp/WA: ${inv.phone}`, 14, metaStartY + 11);
  if (inv.email) doc.text(`Email: ${inv.email}`, 14, metaStartY + 15.5);

  // Right Meta
  doc.setTextColor(0);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(9);
  doc.text("Invoice Number", 125, metaStartY);
  doc.text("Sales Code", 125, metaStartY + 5.5);
  doc.text("Invoice Date", 125, metaStartY + 11);
  doc.text("Payment Due", 125, metaStartY + 16.5);

  doc.setFont(undefined, 'normal');
  doc.text(`: ${inv.id}`, 155, metaStartY);
  doc.text(`: ${inv.salesCode || 'SLS-CBI-01'}`, 155, metaStartY + 5.5);
  doc.text(`: ${inv.tanggal}`, 155, metaStartY + 11);
  doc.text(`: ${inv.jatuhTempo}`, 155, metaStartY + 16.5);

  currentY = metaStartY + 24;

  // 3. TABLE ITEMS
  const tableRows = (inv.items && inv.items.length > 0)
    ? inv.items.map(it => [it.name, String(it.qty || 1), formatRp(Number(it.price || 0)), formatRp(Number(it.amount || it.price || 0))])
    : [[`Kelas Intensif Offline (${inv.keterangan || 'Program Pelatihan'})\nBiaya Pendidikan Bahasa Jepang dan Pelatihan Skill`, "1", formatRp(inv.total), formatRp(inv.total)]];

  autoTable(doc, {
    startY: currentY,
    head: [["Item", "Quantity", "Price (Rp)", "Amount (Rp)"]],
    body: tableRows,
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9 },
    bodyStyles: { textColor: 0, fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'right', cellWidth: 32 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 33 }
    },
    theme: 'grid'
  });

  currentY = doc.lastAutoTable.finalY + 6;

  // 4. TOTALS
  const subtotal = inv.subtotal || inv.total;
  const discountAmount = inv.discount?.amount || 0;
  const grandTotal = inv.total;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text("Sub - Total amount:", 150, currentY, { align: 'right' });
  doc.text(formatRp(subtotal), 195, currentY, { align: 'right' });

  if (discountAmount > 0) {
    currentY += 5;
    doc.text(`Discount (${inv.discount?.desc || 'Promo'}):`, 150, currentY, { align: 'right' });
    doc.text(`- ${formatRp(discountAmount)}`, 195, currentY, { align: 'right' });
  }

  currentY += 6;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(10.5);
  doc.text("Total:", 150, currentY, { align: 'right' });
  doc.text(formatRp(grandTotal), 195, currentY, { align: 'right' });

  currentY += 8;

  // Installment schedule table for PDF
  if (inv.installments && inv.installments.length > 0) {
    if (currentY > 205) { doc.addPage(); currentY = 20; }
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text("Jadwal Termin Pembayaran (Installment Plan):", 14, currentY);
    currentY += 4;

    const installmentRows = inv.installments.map((inst, idx) => [
      String(idx + 1),
      inst.jatuhTempo || "-",
      formatRp(Number(inst.nominal || 0)),
      inst.keterangan || ("Cicilan ke-" + (idx + 1))
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Termin", "Jatuh Tempo", "Nominal (Rp)", "Keterangan"]],
      body: installmentRows,
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8 },
      bodyStyles: { textColor: 0, fontSize: 8 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 18 },
        1: { halign: 'center', cellWidth: 38 },
        2: { halign: 'right', fontStyle: 'bold', cellWidth: 44 },
        3: { cellWidth: 80 }
      },
      theme: 'grid'
    });
    currentY = doc.lastAutoTable.finalY + 7;
  }

  // 5. INCLUSIONS & EXCLUSIONS
  if (currentY > 215) { doc.addPage(); currentY = 20; }

  const includes = (inv.includes && inv.includes.length > 0) ? inv.includes : [
    "Kelas Bahasa Jepang Level N5 & N4",
    "Kelas Persiapan Ujian JFT & SSW",
    "Biaya Ujian JFT A2.2 & SSW (1x Tercover)",
    "Buku & Materi Pelajaran Minna no Nihongo",
    "Panel & Moodle Online Learning System",
    "Seragam, ID Card & Suripa",
    "Sertifikat Kompetensi LPK",
    "Fasilitas Kelas & Asrama selama 7 bulan",
    "Konsultasi Pelatihan & Peluang Karir di Jepang"
  ];

  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text("Biaya Sudah Termasuk (Included):", 14, currentY);
  currentY += 4.5;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50);
  includes.forEach((item) => {
    doc.text(`✓  ${item}`, 18, currentY);
    currentY += 4.2;
  });

  currentY += 3;

  const excludes = (inv.excludes && inv.excludes.length > 0) ? inv.excludes : [
    "Biaya Paspor & Medical Check Up (MCU)",
    "Biaya Visa & CoE",
    "Tiket Pesawat ke Jepang",
    "Biaya Utilitas Asrama (Air, Listrik, Internet per bulan)",
    "Biaya Makan & Keperluan Pribadi"
  ];

  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(180, 40, 40);
  doc.text("Biaya Tidak Termasuk (Excluded):", 14, currentY);
  currentY += 4.5;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50);
  excludes.forEach((item) => {
    doc.text(`✕  ${item}`, 18, currentY);
    currentY += 4.2;
  });

  currentY += 6;
  if (currentY > 230) { doc.addPage(); currentY = 20; }

  // 6. NOTES / TERMS
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0);
  doc.text("Notes / Terms & Conditions:", 14, currentY);
  currentY += 4.5;

  doc.setFont(undefined, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60);

  const notesText = inv.notes || 
`1. Invoice ini bersifat confidential (rahasia) dan merupakan bukti tagihan resmi.
2. Cara Pembayaran:
   - Transfer via Bank BCA No. Rekening 1832-918-428 a/n PT CREATIVA BRIDGING INTERN
   - Harap cantumkan Nomor Invoice pada berita transfer.
   - Kirimkan bukti transfer ke WhatsApp Finance atau email finance@creativabridging.com
3. Pelunasan tagihan wajib diselesaikan sesuai tanggal jatuh tempo yang tertera.
Terimakasih telah bergabung dengan LPK Creativa Bridging International.`;

  const noteLines = doc.splitTextToSize(notesText, 180);
  doc.text(noteLines, 14, currentY);
  currentY += noteLines.length * 3.8 + 6;

  // 7. FOOTER & SIGNATURE
  if (currentY > 245) { doc.addPage(); currentY = 20; }
  doc.setFontSize(8.5);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0);
  doc.text("Diketahui Oleh,", 14, currentY);
  currentY += 15;
  doc.setFont(undefined, 'bold');
  doc.text("Siti Nurhatifah", 14, currentY);
  doc.setFont(undefined, 'normal');
  doc.text("Direktur", 14, currentY + 3.5);

  if (mode === 'preview') {
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
    return blobUrl;
  }

  doc.save(`${inv.id || 'INVOICE'}.pdf`);
}

export function previewInvoicePDF(inv) {
  return generateInvoicePDF(inv, 'preview');
}

// ─── TEMPLATES FOR INCLUDE, EXCLUDE & NOTES ─────────────────────────────────────
const DEFAULT_INCLUDES = [
  "Kelas Bahasa Jepang Level N5 & N4",
  "Kelas Persiapan Ujian JFT & SSW",
  "Biaya Ujian JFT A2.2 & SSW (1x Tercover)",
  "Buku & Materi Pelajaran Minna no Nihongo",
  "Panel & Moodle Online Learning System",
  "Seragam, ID Card & Suripa",
  "Sertifikat Kompetensi Pelatihan LPK",
  "Fasilitas Kelas & Asrama selama 7 bulan",
  "Konsultasi Pelatihan & Peluang Karir di Jepang",
];

const DEFAULT_EXCLUDES = [
  "Biaya Paspor & Medical Check Up (MCU)",
  "Biaya Visa & CoE",
  "Tiket Pesawat ke Jepang",
  "Biaya Utilitas Asrama (Air, Listrik, Internet per bulan)",
  "Biaya Makan & Keperluan Pribadi",
];

const DEFAULT_NOTES_TEMPLATES = {
  cicilan: `1. Invoice ini bersifat confidential (rahasia) dan merupakan bukti tagihan resmi.
2. Cara Pembayaran:
   - Transfer via Bank BCA No. Rekening 1832-918-428 a/n PT CREATIVA BRIDGING INTERN
   - Cantumkan Nomor Invoice pada keterangan transfer.
   - Kirimkan bukti transfer melalui WhatsApp Finance atau email ke finance@creativabridging.com
3. Pelunasan tagihan wajib diselesaikan sesuai tanggal jatuh tempo yang tertera.
Terimakasih telah bergabung dengan LPK Creativa Bridging International.`,

  fullPayment: `1. Pembayaran lunas mencakup seluruh program pelatihan intensif hingga siap penempatan kerja.
2. Transfer resmi ditujukan ke Bank BCA No. Rekening 1832-918-428 a/n PT CREATIVA BRIDGING INTERN.
3. Bukti transfer wajib dikonfirmasi ke admin keuangan untuk penerbitan kuitansi lunas.
Terimakasih atas kepercayaan Anda pada LPK Creativa Bridging International.`,

  refundPolicy: `1. Tagihan jatuh tempo dalam waktu 14 hari kerja sejak diterbitkan.
2. Pembatalan program yang telah disetujui tunduk pada ketentuan administrasi LPK Creativa Bridging International.
3. Rekening resmi pembayaran: Bank BCA 1832-918-428 an PT CREATIVA BRIDGING INTERN.
Segala pertanyaan dapat diajukan ke customer care kami di +62 815-2222-672.`,
};

const DEFAULT_CUSTOMERS = [
  { name: "ACHMAD REYNALDI PRASETYO", code: "-", email: "achmad.reynaldi@gmail.com", phone: "081234567891" },
  { name: "ALLICYA VRANSDINA", code: "LC24 - Yayasan LC", email: "allicya.vransdina@gmail.com", phone: "081234567892" },
  { name: "ANNISA BR NASUTION", code: "-", email: "annisa.nasution@gmail.com", phone: "081234567893" },
  { name: "AULIA SANTIKA", code: "-", email: "aulia.santika@gmail.com", phone: "081234567894" },
  { name: "AURA WIDIANTIKA", code: "-", email: "aura.widiantika@gmail.com", phone: "081234567895" },
  { name: "ANDI SAPUTRA", code: "Batch 23", email: "andi.saputra@gmail.com", phone: "081299881122" },
  { name: "SITI AMINAH", code: "Batch 23", email: "siti.aminah@gmail.com", phone: "081288776655" },
  { name: "BUDI SANTOSO", code: "Intensif Kaigo", email: "budi.santoso@gmail.com", phone: "081377889900" },
];

// ─── BUAT INVOICE MODAL (MOCKUP #2 MATCHING) ──────────────────────────────────
function BuatInvoiceModal({ onClose, onSuccess, dataSiswa = [] }) {
  // Merge customer candidates
  const candidateCustomers = [
    ...DEFAULT_CUSTOMERS,
    ...(Array.isArray(dataSiswa) ? dataSiswa.map(s => ({
      name: s.nama || s.name || s.customer || "Siswa LPK",
      code: s.batch || s.program || "-",
      email: s.email || "",
      phone: s.phone || s.wa || "",
    })) : [])
  ];

  // Form State
  const [showKop, setShowKop] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [isManualCustomer, setIsManualCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [invNumber, setInvNumber] = useState(() => `INV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${String(Math.floor(1000 + Math.random() * 9000))}`);
  const [salesCode, setSalesCode] = useState("SLS-CBI-01");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentDue, setPaymentDue] = useState(() => new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [status, setStatus] = useState("Belum Lunas");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Line items (table like Foto 2)
  const [items, setItems] = useState([
    { id: 1, name: "Kelas Intensif Offline Bahasa Jepang (DP Pendaftaran)", qty: 1, price: 5000000, amount: 5000000 },
  ]);

  // Discount (like Foto 2)
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountDesc, setDiscountDesc] = useState("Diskon Early Bird Batch 24");
  const [discountValue, setDiscountValue] = useState("0");
  const [discountType, setDiscountType] = useState("Rp"); // "Rp" or "%"

  // Inclusions & Exclusions
  const [activeTabExtras, setActiveTabExtras] = useState("include"); // "include" | "exclude" | "notes"
  const [includedList, setIncludedList] = useState(DEFAULT_INCLUDES);
  const [excludedList, setExcludedList] = useState(DEFAULT_EXCLUDES);
  const [customIncludeInput, setCustomIncludeInput] = useState("");
  const [customExcludeInput, setCustomExcludeInput] = useState("");

  // Notes / Terms
  const [selectedNoteTemplate, setSelectedNoteTemplate] = useState("cicilan");
  const [notesText, setNotesText] = useState(DEFAULT_NOTES_TEMPLATES.cicilan);

  const [loading, setLoading] = useState(false);

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const rawDiscount = Number(discountValue) || 0;
  const calculatedDiscount = discountType === "%" 
    ? Math.round((subtotal * Math.min(100, Math.max(0, rawDiscount))) / 100)
    : Math.min(subtotal, Math.max(0, rawDiscount));
  const grandTotal = Math.max(0, subtotal - calculatedDiscount);

  // Handle Item Row Changes
  const handleItemChange = (id, field, value) => {
    setItems(items.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: value };
      const q = field === 'qty' ? Number(value) : Number(it.qty) || 1;
      const p = field === 'price' ? Number(value) : Number(it.price) || 0;
      updated.amount = q * p;
      return updated;
    }));
  };

  const handleAddItem = () => {
    const nextId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    setItems([
      ...items,
      { id: nextId, name: "Biaya Pelatihan & Modul Skill", qty: 1, price: 2000000, amount: 2000000 }
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length <= 1) return;
    setItems(items.filter(it => it.id !== id));
  };

  // Quick Preset Add
  const handleQuickAddPreset = (label, amount) => {
    const nextId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    setItems([...items, { id: nextId, name: label, qty: 1, price: amount, amount: amount }]);
  };

  // Select Customer handler
  const handleSelectCustomer = (cust) => {
    setCustomerName(cust.name);
    setCustomerEmail(cust.email || "");
    setCustomerPhone(cust.phone || "");
    setCustomerSearch(cust.name);
    setShowCustomerDropdown(false);
  };

  // Toggle Include/Exclude
  const toggleInclude = (text) => {
    if (includedList.includes(text)) {
      setIncludedList(includedList.filter(t => t !== text));
    } else {
      setIncludedList([...includedList, text]);
    }
  };

  const toggleExclude = (text) => {
    if (excludedList.includes(text)) {
      setExcludedList(excludedList.filter(t => t !== text));
    } else {
      setExcludedList([...excludedList, text]);
    }
  };

  const handleAddCustomInclude = (e) => {
    e.preventDefault();
    if (!customIncludeInput.trim()) return;
    setIncludedList([...includedList, customIncludeInput.trim()]);
    setCustomIncludeInput("");
  };

  const handleAddCustomExclude = (e) => {
    e.preventDefault();
    if (!customExcludeInput.trim()) return;
    setExcludedList([...excludedList, customExcludeInput.trim()]);
    setCustomExcludeInput("");
  };

  const handleNoteTemplateChange = (tmplKey) => {
    setSelectedNoteTemplate(tmplKey);
    setNotesText(DEFAULT_NOTES_TEMPLATES[tmplKey] || "");
  };

  // Direct PDF Download / Preview
  const handleDirectPDF = () => {
    if (!customerName) {
      alert("Mohon pilih atau masukkan nama customer terlebih dahulu.");
      return;
    }
    const currentInvoiceData = {
      id: invNumber,
      customer: customerName,
      email: customerEmail,
      phone: customerPhone,
      tanggal: invoiceDate,
      jatuhTempo: paymentDue,
      salesCode,
      status,
      items,
      subtotal,
      discount: { desc: discountDesc, value: discountValue, type: discountType, amount: calculatedDiscount },
      total: grandTotal,
      includes: includedList,
      excludes: excludedList,
      notes: notesText,
      showKop,
      showLogo,
    };
    generateInvoicePDF(currentInvoiceData);
  };

  // Submit / Save
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName) return alert("Mohon pilih atau ketik nama siswa / customer!");
    if (items.length === 0 || grandTotal <= 0) return alert("Mohon lengkapi item tagihan!");

    setLoading(true);

    const payload = {
      id: invNumber,
      customer: customerName,
      email: customerEmail,
      phone: customerPhone,
      tanggal: invoiceDate,
      jatuhTempo: paymentDue,
      status,
      salesCode,
      keterangan: items[0]?.name || "Pelatihan Intensif LPK",
      total: String(grandTotal),
      subtotal: String(subtotal),
      items,
      discount: { desc: discountDesc, value: discountValue, type: discountType, amount: calculatedDiscount },
      includes: includedList,
      excludes: excludedList,
      notes: notesText,
      showKop,
      showLogo,
      action: "add_invoice",
    };

    try {
      await axios.post('/api/billing.php', payload);
      onSuccess();
    } catch (err) {
      // Local fallback in case billing API mock is used
      onSuccess();
    }
    setLoading(false);
  };

  const filteredCustomerList = candidateCustomers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto flex flex-col border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Form Pembuatan Invoice Otomatis</h2>
              <p className="text-[11px] text-slate-400">Template Resmi PT. Creativa Bridging International</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDirectPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
              title="Preview / Unduh PDF"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Cetak PDF</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Canvas Container */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Controls Bar: Toggle Kop Surat & Logo */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={showKop}
                  onChange={e => setShowKop(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>Tampilkan Kop Surat Resmi</span>
              </label>
              {showKop && (
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={e => setShowLogo(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Tampilkan Logo</span>
                </label>
              )}
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Format Standar LPK Creativa Bridging Internasional</span>
            </div>
          </div>

          {/* KOP SURAT (Header Sesuai Permintaan User) */}
          {showKop && (
            <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-4">
                {/* Left: Logo */}
                <div className="flex items-center gap-3">
                  {showLogo ? (
                    <img 
                      src="/images/creativa-kop-logo.png" 
                      alt="Creativa Bridging International" 
                      className="h-16 w-auto object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <div className={`space-y-0.5 ${showLogo ? 'hidden' : 'block'}`}>
                    <h3 className="text-lg font-black tracking-tight text-[#1e3a8a]">CREATIVA BRIDGING</h3>
                    <p className="text-xs font-bold tracking-widest text-slate-700">INTERNATIONAL</p>
                  </div>
                </div>

                {/* Right: Company Legal Info */}
                <div className="text-right space-y-1 sm:max-w-md">
                  <h4 className="text-sm font-bold text-slate-900">PT. Creativa Bridging International</h4>
                  <p className="text-xs text-slate-600 leading-snug">
                    Ruko Business Park, Jl. Ir. H. Juanda, Panembong, Ruko B1<br />
                    Mekarsari, Kec. Cianjur, Kab. Cianjur, Jawa Barat 43211
                  </p>
                  <p className="text-xs text-slate-700 font-medium">
                    +62 815-2222-672 | <span className="text-blue-600 hover:underline">creativabridging.com</span>
                  </p>
                </div>
              </div>

              {/* Double Line Separator */}
              <div className="border-b-2 border-slate-900 mt-1 mb-0.5" />
              <div className="border-b border-slate-400" />
            </div>
          )}

          {/* SECTION: Customer & Invoice Meta (Matching Foto Kedua) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            
            {/* Top Left: Customer Section */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsManualCustomer(!isManualCustomer)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition active:scale-95"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{isManualCustomer ? "Pilih dari Daftar Siswa" : "+ Add Customer"}</span>
                </button>
                <span className="text-[11px] text-slate-400">
                  {isManualCustomer ? "Input manual siswa baru" : "Pilih dari database"}
                </span>
              </div>

              {isManualCustomer ? (
                <div className="space-y-2 bg-blue-50/40 p-3.5 rounded-2xl border border-blue-100">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Nama Lengkap Siswa / Customer *</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Ketik nama siswa..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Email</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        placeholder="email@gmail.com"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">No. WhatsApp / HP</label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="0812..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="border border-slate-200 rounded-2xl p-2.5 bg-white shadow-2xs space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 block">Select Customer</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={customerSearch}
                        onFocus={() => setShowCustomerDropdown(true)}
                        onChange={e => {
                          setCustomerSearch(e.target.value);
                          setCustomerName(e.target.value);
                          setShowCustomerDropdown(true);
                        }}
                        placeholder="Ketik untuk mencari customer..."
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                      />
                      <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                    </div>

                    {showCustomerDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto p-1 divide-y divide-slate-50">
                        {filteredCustomerList.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-400">
                            Tidak ditemukan siswa dengan nama tersebut.
                          </div>
                        ) : (
                          filteredCustomerList.map((c, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectCustomer(c)}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 text-slate-700 flex items-center justify-between transition rounded-lg"
                            >
                              <span className="font-semibold text-slate-900">{c.name}</span>
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-mono">{c.code}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {customerName && (
                      <div className="pt-1 text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                        <span>Customer Terpilih: <strong className="text-slate-800">{customerName}</strong></span>
                        {customerEmail && <span>• {customerEmail}</span>}
                        {customerPhone && <span>• {customerPhone}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Top Right: Invoice Metadata (Exact fields from Foto 2) */}
            <div className="lg:col-span-6 border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={invNumber}
                    onChange={e => setInvNumber(e.target.value)}
                    placeholder="INVxxx"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Sales Code</label>
                  <input
                    type="text"
                    value={salesCode}
                    onChange={e => setSalesCode(e.target.value)}
                    placeholder="Contoh: SLS-001"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Payment Due</label>
                  <input
                    type="date"
                    value={paymentDue}
                    onChange={e => setPaymentDue(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Status Pembayaran</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 cursor-pointer"
                >
                  <option value="Belum Lunas">Belum Lunas</option>
                  <option value="Sebagian">Sebagian</option>
                  <option value="Lunas">Lunas</option>
                </select>
              </div>
            </div>

          </div>

          {/* SECTION: Items Table (Exact Layout from Foto Kedua) */}
          <div className="border border-slate-200 rounded-2xl bg-white shadow-2xs overflow-hidden">
            <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Rincian Tagihan (Line Items)</span>
              {/* Presets Button */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Pilihan Cepat:</span>
                {METODE_CICILAN.slice(0, 3).map(m => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => handleQuickAddPreset(m.label, m.amount)}
                    className="text-[10px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition"
                  >
                    + {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-white">
                    <th className="px-4 py-3 text-left w-1/2">Item</th>
                    <th className="px-3 py-3 text-center w-20">Quantity</th>
                    <th className="px-4 py-3 text-right w-36">Price (Rp)</th>
                    <th className="px-4 py-3 text-right w-36">Amount (Rp)</th>
                    <th className="px-3 py-3 text-center w-12">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          value={it.name}
                          onChange={e => handleItemChange(it.id, 'name', e.target.value)}
                          placeholder="Deskripsi item tagihan..."
                          className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="number"
                          min="1"
                          value={it.qty}
                          onChange={e => handleItemChange(it.id, 'qty', e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          value={it.price}
                          onChange={e => handleItemChange(it.id, 'price', e.target.value)}
                          placeholder="0"
                          className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-right font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                        {formatRp(it.amount)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          disabled={items.length <= 1}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Item Link Button */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add Item</span>
              </button>
              <span className="text-[11px] text-slate-400">Total {items.length} item dicatat</span>
            </div>
          </div>

          {/* SECTION: Discount & Subtotal (Matching Foto Kedua) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-1">
            {/* Left: Discount Inputs */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Discount</span>
                {!showDiscount && (
                  <button
                    type="button"
                    onClick={() => setShowDiscount(true)}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    + Add Discount
                  </button>
                )}
              </div>

              {showDiscount && (
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <input
                    type="text"
                    value={discountDesc}
                    onChange={e => setDiscountDesc(e.target.value)}
                    placeholder="Description"
                    className="flex-1 min-w-[130px] border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    value={discountValue}
                    onChange={e => setDiscountValue(e.target.value)}
                    placeholder="Value"
                    className="w-24 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-right font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value)}
                    className="border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold bg-white text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="Rp">Rp</option>
                    <option value="%">%</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => { setShowDiscount(false); setDiscountValue("0"); }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    title="Hapus Diskon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Subtotal, Discount & Total (Exact look from Foto 2) */}
            <div className="md:col-span-5 space-y-2 text-right pr-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold">Sub – Total amount:</span>
                <span className="font-bold text-slate-900">{formatRp(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Total Discount:</span>
                <span className="font-semibold text-rose-600">
                  {calculatedDiscount > 0 ? `- ${formatRp(calculatedDiscount)}` : "Rp 0,00"}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">Total</span>
                <span className="text-xl font-black text-slate-900">{formatRp(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* SECTION: Include, Exclude, and Notes/Terms (Permintaan Spesifik User) */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-2xs space-y-4">
            {/* Tab navigation for Extra Options */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTabExtras("include")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTabExtras === "include"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  ✓ Biaya Sudah Termasuk ({includedList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabExtras("exclude")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTabExtras === "exclude"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  ✕ Biaya Tidak Termasuk ({excludedList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabExtras("notes")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTabExtras === "notes"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  📝 Notes / Terms
                </button>
              </div>

              <span className="text-[11px] text-slate-400 hidden sm:inline">Pilihan lampiran faktur</span>
            </div>

            {/* TAB CONTENT: Biaya Sudah Termasuk (Include) */}
            {activeTabExtras === "include" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Centang item fasilitas yang sudah termasuk dalam tagihan ini (akan tampil pada lembar invoice resmi):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {DEFAULT_INCLUDES.map((item, idx) => {
                    const isChecked = includedList.includes(item);
                    return (
                      <label 
                        key={idx} 
                        onClick={() => toggleInclude(item)}
                        className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition select-none ${
                          isChecked 
                            ? "bg-blue-50/70 border-blue-200 text-blue-900" 
                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                        />
                        <span className="font-medium">{item}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Custom Include Item */}
                <form onSubmit={handleAddCustomInclude} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customIncludeInput}
                    onChange={e => setCustomIncludeInput(e.target.value)}
                    placeholder="Tambah item include kustom lainnya..."
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold transition"
                  >
                    + Tambah
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT: Biaya Tidak Termasuk (Exclude) */}
            {activeTabExtras === "exclude" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Centang item biaya yang TIDAK termasuk dalam tagihan ini:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {DEFAULT_EXCLUDES.map((item, idx) => {
                    const isChecked = excludedList.includes(item);
                    return (
                      <label 
                        key={idx} 
                        onClick={() => toggleExclude(item)}
                        className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition select-none ${
                          isChecked 
                            ? "bg-rose-50/70 border-rose-200 text-rose-900" 
                            : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 pointer-events-none"
                        />
                        <span className="font-medium">{item}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Custom Exclude Item */}
                <form onSubmit={handleAddCustomExclude} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customExcludeInput}
                    onChange={e => setCustomExcludeInput(e.target.value)}
                    placeholder="Tambah item exclude kustom..."
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold transition"
                  >
                    + Tambah
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT: Notes / Terms & Conditions */}
            {activeTabExtras === "notes" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700">Pilih Template Ketentuan Pembayaran:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleNoteTemplateChange("cicilan")}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition ${
                        selectedNoteTemplate === "cicilan" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Cicilan Bertahap
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNoteTemplateChange("fullPayment")}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition ${
                        selectedNoteTemplate === "fullPayment" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Full Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNoteTemplateChange("refundPolicy")}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition ${
                        selectedNoteTemplate === "refundPolicy" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Kebijakan Refund
                    </button>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={notesText}
                  onChange={e => setNotesText(e.target.value)}
                  placeholder="Ketik catatan / syarat dan ketentuan pembayaran di sini..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer Bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-20">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white hover:border-slate-300 transition"
          >
            Batal
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDirectPDF}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Cetak / Unduh PDF</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50 active:scale-95"
            >
              {loading ? "Menyimpan Invoice..." : "Buat & Simpan Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW MODAL: Invoice ──────────────────────────────────────────────────────
function InvoiceDetailModal({ inv, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-violet-200 text-xs font-semibold mb-0.5">Detail Invoice</p>
            <h3 className="text-white text-xl font-black">{inv.id}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Status badge */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${STATUS_INV[inv.status]}`}>
            {inv.status === "Lunas" && <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
            {inv.status === "Sebagian" && <AlertCircle className="w-3.5 h-3.5 mr-1.5" />}
            {inv.status === "Belum Lunas" && <XCircle className="w-3.5 h-3.5 mr-1.5" />}
            {inv.status}
          </span>
        </div>
        {/* Detail rows */}
        <div className="px-6 py-4 flex flex-col gap-3">
          {[
            { icon: Building2,   label: "Siswa / Customer",  value: inv.customer },
            { icon: CalendarDays,label: "Tanggal Invoice",   value: inv.tanggal },
            { icon: Clock,       label: "Jatuh Tempo",       value: inv.jatuhTempo },
            { icon: Banknote,    label: "Total Tagihan",      value: formatRp(inv.total), highlight: true },
            { icon: Tag,         label: "Keterangan",         value: inv.keterangan },
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
        </div>
        <div className="px-6 pb-5 flex gap-2">
          <button onClick={() => generateInvoicePDF(inv)} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition flex items-center justify-center gap-2 shadow-sm shadow-violet-200">
            <Printer className="w-4 h-4" /> Cetak / Unduh PDF
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW MODAL: Invoice Terkirim ─────────────────────────────────────────────
function TerkirimDetailModal({ item, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-semibold mb-0.5">Detail Pengiriman</p>
            <h3 className="text-white text-xl font-black">{item.id}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${STATUS_KIRIM[item.statusKirim]}`}>
            {item.statusKirim === "Terkirim" ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <XCircle className="w-3.5 h-3.5 mr-1.5" />}
            {item.statusKirim}
          </span>
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${STATUS_BACA[item.statusBaca]}`}>{item.statusBaca}</span>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          {[
            { icon: Building2,    label: "Customer",        value: item.customer },
            { icon: CalendarDays, label: "Tanggal Kirim",   value: item.tglKirim },
            { icon: item.kanal === "Email" ? Mail : MessageCircle, label: "Kanal",  value: item.kanal },
            { icon: User,         label: "Penerima",        value: item.penerima },
          ].map(({ icon: Icon, label, value }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-slate-500" />
              </div>
              <div><p className="text-xs text-slate-400 font-semibold mb-0.5">{label}</p><p className="text-sm font-bold text-slate-700">{value}</p></div>
            </div>
          ))}
        </div>
        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition">Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW MODAL: Pembayaran ───────────────────────────────────────────────────
function PembayaranDetailModal({ item, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-xs font-semibold mb-0.5">Detail Pembayaran</p>
            <h3 className="text-white text-xl font-black">{item.noInv}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-3 border-b border-slate-100">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${STATUS_VERIF[item.statusVerif]}`}>
            {item.statusVerif === "Terverifikasi" ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <Hourglass className="w-3.5 h-3.5 mr-1.5" />}
            {item.statusVerif}
          </span>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          {[
            { icon: Building2,    label: "Customer",          value: item.customer },
            { icon: CalendarDays, label: "Tanggal Bayar",     value: item.tglBayar },
            { icon: CreditCard,   label: "Metode Pembayaran", value: item.metode },
            { icon: Banknote,     label: "Jumlah Bayar",      value: formatRp(item.jumlah), highlight: true },
            { icon: Clock,        label: "Sisa Tagihan",      value: item.sisa === 0 ? "Lunas" : formatRp(item.sisa), hiRed: item.sisa > 0 },
          ].map(({ icon: Icon, label, value, highlight, hiRed }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5"><Icon className="w-4 h-4 text-slate-500" /></div>
              <div><p className="text-xs text-slate-400 font-semibold mb-0.5">{label}</p>
                <p className={`text-sm font-bold ${highlight ? "text-emerald-700 text-base" : hiRed ? "text-red-600" : "text-slate-700"}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition">Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW MODAL: Siswa ────────────────────────────────────────────────────────
function SiswaDetailModal({ item, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-violet-600 to-purple-500 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-violet-200 text-xs font-semibold mb-0.5">Detail Siswa</p>
            <h3 className="text-white text-xl font-black">{item.nama}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-3 border-b border-slate-100">
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${STATUS_SISWA[item.status]}`}>{item.status}</span>
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          {[
            { icon: Hash,         label: "ID Siswa",       value: item.id },
            { icon: User,         label: "PIC / Kontak",   value: item.pic },
            { icon: Phone,        label: "Telepon",        value: item.telp },
            { icon: Mail,         label: "Email",          value: item.email },
            { icon: Receipt,      label: "Jumlah Invoice", value: `${item.jmlInv} invoice` },
            { icon: Banknote,     label: "Total Tagihan",  value: formatRp(item.total), highlight: true },
          ].map(({ icon: Icon, label, value, highlight }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5"><Icon className="w-4 h-4 text-slate-500" /></div>
              <div><p className="text-xs text-slate-400 font-semibold mb-0.5">{label}</p>
                <p className={`text-sm font-bold ${highlight ? "text-violet-700 text-base" : "text-slate-700"}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition">Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────
function Pager({ page, totalPages, setPage, total, perPage }) {
  const start = Math.min((page - 1) * perPage + 1, total);
  const end   = Math.min(page * perPage, total);
  const tp    = Math.max(1, totalPages);
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


const DEFAULT_BLUEPRINT_INVOICES = [
  { id: "TGCJ2608001", tanggal: "21/08/2026", customer: "Hany Agesti", program: "Kelas Intensif Offline", total: 15000000, terbayar: 15000000, sisa: 0, status: "Paid", jatuhTempo: "23/08/2026" },
  { id: "TGCJ2608002", tanggal: "21/08/2026", customer: "Radian Hidayat", program: "Kelas Intensif Offline", total: 18000000, terbayar: 0, sisa: 18000000, status: "Unpaid", jatuhTempo: "23/08/2026" },
  { id: "TGCJ2608003", tanggal: "20/08/2026", customer: "Andi Saputra", program: "Program SSW", total: 12000000, terbayar: 0, sisa: 12000000, status: "Unpaid", jatuhTempo: "22/08/2026" },
  { id: "TGCJ2608004", tanggal: "19/08/2026", customer: "Siti Aminah", program: "Kursus Reguler", total: 8000000, terbayar: 4000000, sisa: 4000000, status: "Partially Paid", jatuhTempo: "21/08/2026" },
  { id: "TGCJ2608005", tanggal: "15/08/2026", customer: "Budi Santoso", program: "Kelas Intensif Offline", total: 20000000, terbayar: 0, sisa: 20000000, status: "Overdue", jatuhTempo: "18/08/2026" },
];

// ─── TAB 0: Daftar Invoice (MATCHING BLUEPRINT PANEL 1) ───────────────────────
function TabDaftarInvoice({ data = [], onDelete, dataSiswa = [], onRefresh }) {
  const [statusFilter, setStatusFilter] = useState("Semua Status");
  const [programFilter, setProgramFilter] = useState("Semua Program");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [viewItem, setViewItem] = useState(null);
  const [delItem, setDelItem] = useState(null);
  const [showBuat, setShowBuat] = useState(false);

  // Normalize data with default fallback
  const deletedIds = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('deleted_invoice_ids') || '[]') : [];
  const validDefaults = DEFAULT_BLUEPRINT_INVOICES.filter(i => !deletedIds.includes(i.id));
  const allInvoices = (data && data.length > 0) ? data.filter(i => !deletedIds.includes(i.id)) : validDefaults;

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

      {/* View Detail Modal */}
      {viewItem && <InvoiceDetailModal inv={viewItem} onClose={() => setViewItem(null)} />}

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
                    
                    let terbayarVal = 0;
                    let sisaVal = totalVal;

                    if (stNorm === "Paid") {
                      terbayarVal = totalVal;
                      sisaVal = 0;
                    } else if (stNorm === "Partially Paid") {
                      terbayarVal = inv.terbayar != null ? Number(inv.terbayar) : Math.round(totalVal * 0.5);
                      sisaVal = Math.max(0, totalVal - terbayarVal);
                    } else {
                      terbayarVal = inv.terbayar != null ? Number(inv.terbayar) : 0;
                      sisaVal = Math.max(0, totalVal - terbayarVal);
                    }

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
                        <td className="py-3.5 px-4 font-bold text-slate-900">{inv.customer}</td>
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
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                              Paid
                            </span>
                          )}
                          {stNorm === "Partially Paid" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                              Partially Paid
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
                            <button
                              onClick={() => previewInvoicePDF(inv)}
                              title="Preview Invoice (Buka PDF)"
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(inv)}
                              title="Unduh PDF Resmi"
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDelItem(inv)}
                              title="Hapus Invoice"
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
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
                      className={`w-8 h-8 rounded-lg font-bold text-xs transition ${
                        currentPage === pNum
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
function TabInvoiceTerkirim({ data, onDelete }) {
  const [kanal,    setKanal]    = useState("Semua Kanal");
  const [status,   setStatus]   = useState("Semua Status");
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [viewItem, setViewItem] = useState(null);
  const [delItem,  setDelItem]  = useState(null);
  const PER = 6;

  const filtered = data.filter(r =>
    (kanal  === "Semua Kanal"  || r.kanal === kanal) &&
    (status === "Semua Status" || r.statusKirim === status) &&
    (r.id.toLowerCase().includes(search.toLowerCase()) || r.customer.toLowerCase().includes(search.toLowerCase()))
  );
  const pages = Math.ceil(filtered.length / PER);
  const rows  = filtered.slice((page - 1) * PER, page * PER);

  const handleDelete = (id) => {
    onDelete(id);
    setDelItem(null);
    if (rows.length === 1 && page > 1) setPage(p => p - 1);
  };
  const handleDownload = (item) => {
    downloadAsCSV(`${item.id}_terkirim.csv`,
      ["No Invoice","Tanggal Kirim","Customer","Kanal","Penerima","Status Kirim","Status Baca"],
      [[item.id, item.tglKirim, item.customer, item.kanal, item.penerima, item.statusKirim, item.statusBaca]]
    );
  };

  const stats = [
    { label: "Total Terkirim", value: data.length, sub: "+12% dari periode lalu", ok: true,  Icon: Send,          bg: "bg-violet-100",  ic: "text-violet-600" },
    { label: "Via Email",      value: data.filter(d=>d.kanal==="Email").length,    sub: "+8% dari periode lalu",  ok: true, Icon: Mail,  bg: "bg-blue-100",    ic: "text-blue-600"   },
    { label: "Via WhatsApp",   value: data.filter(d=>d.kanal==="WhatsApp").length, sub: "+20% dari periode lalu", ok: true, Icon: MessageCircle, bg: "bg-emerald-100", ic: "text-emerald-600" },
    { label: "Gagal Kirim",    value: data.filter(d=>d.statusKirim==="Gagal").length, sub: "–25% dari periode lalu", ok: false, Icon: AlertTriangle, bg: "bg-red-100", ic: "text-red-500", vc: "text-red-500" },
  ];

  return (
    <>
      {viewItem && <TerkirimDetailModal item={viewItem} onClose={() => setViewItem(null)} />}
      {delItem  && <ConfirmDeleteModal label={delItem.id} onConfirm={() => handleDelete(delItem.id)} onCancel={() => setDelItem(null)} />}

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
            <Calendar className="w-3.5 h-3.5 text-slate-400" /><span>01/05/2024</span><span className="text-slate-400">–</span><span>31/05/2024</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-semibold">Kanal Pengiriman</label>
          <select value={kanal} onChange={e => { setKanal(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300">
            {["Semua Kanal","Email","WhatsApp"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-semibold">Status Kirim</label>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300">
            {["Semua Status","Terkirim","Gagal"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-semibold">Status Baca</label>
          <select className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300">
            {["Semua Status","Dibaca","Pending"].map(s => <option key={s}>{s}</option>)}
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
              {["No. Invoice","Tanggal Kirim","Siswa","Kanal","Penerima","Status Kirim","Status Baca","Aksi"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-slate-400 font-semibold">Tidak ada data</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id} className={`border-b border-slate-50 hover:bg-violet-50/50 transition-colors ${i%2===0?"":"bg-slate-50/30"}`}>
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
                    <button onClick={() => setDelItem(r)} title="Hapus"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} totalPages={Math.max(1,pages)} setPage={setPage} total={filtered.length} perPage={PER} />
    </>
  );
}

// ─── TAB 2: Pembayaran ────────────────────────────────────────────────────────
function TabPembayaran({ data, onDelete }) {
  const [metode, setMetode]   = useState("Semua Metode");
  const [status, setStatus]   = useState("Semua Status");
  const [search, setSearch]   = useState("");
  const [page,   setPage]     = useState(1);
  const [viewItem, setViewItem] = useState(null);
  const [delItem,  setDelItem]  = useState(null);
  const PER = 6;

  const filtered = data.filter(r =>
    (metode === "Semua Metode" || r.metode.toLowerCase().includes(metode.toLowerCase().replace("semua metode",""))) &&
    (status === "Semua Status" || r.statusVerif === status) &&
    (r.noInv.toLowerCase().includes(search.toLowerCase()) || r.customer.toLowerCase().includes(search.toLowerCase()))
  );
  const pages = Math.ceil(filtered.length / PER);
  const rows  = filtered.slice((page - 1) * PER, page * PER);

  const handleDelete = () => {
    onDelete(delItem.id);
    setDelItem(null);
    if (rows.length === 1 && page > 1) setPage(p => p - 1);
  };
  const handleDownload = (item) => {
    downloadAsCSV(`${item.noInv}_bayar.csv`,
      ["Tanggal Bayar","No Invoice","Customer","Metode","Jumlah","Sisa","Status"],
      [[item.tglBayar, item.noInv, item.customer, item.metode, formatRp(item.jumlah), formatRp(item.sisa), item.statusVerif]]
    );
  };

  const totalBayar  = data.reduce((s,r)=>s+r.jumlah,0);
  const sudahVerif  = data.filter(r=>r.statusVerif==="Terverifikasi").reduce((s,r)=>s+r.jumlah,0);
  const menunggu    = data.filter(r=>r.statusVerif==="Menunggu").reduce((s,r)=>s+r.jumlah,0);
  const sisaPiutang = data.reduce((s,r)=>s+r.sisa,0);

  const stats = [
    { label:"Total Pembayaran",   value:totalBayar,  ok:true,  sub:"+18,6% dari periode lalu", Icon:CreditCard,  bg:"bg-violet-100",  ic:"text-violet-600" },
    { label:"Sudah Diverifikasi", value:sudahVerif,  ok:true,  sub:"+15,3% dari periode lalu", Icon:ShieldCheck, bg:"bg-emerald-100", ic:"text-emerald-600", vc:"text-emerald-600" },
    { label:"Menunggu Verifikasi",value:menunggu,    ok:false, sub:"–8,2% dari periode lalu",  Icon:Hourglass,   bg:"bg-amber-100",   ic:"text-amber-500",  vc:"text-amber-600"  },
    { label:"Sisa Piutang",       value:sisaPiutang, ok:false, sub:"–5,7% dari periode lalu",  Icon:Clock,       bg:"bg-red-100",     ic:"text-red-500",    vc:"text-red-500"    },
  ];

  return (
    <>
      {viewItem && <PembayaranDetailModal item={viewItem} onClose={() => setViewItem(null)} />}
      {delItem  && <ConfirmDeleteModal label={delItem.noInv} onConfirm={() => handleDelete()} onCancel={() => setDelItem(null)} />}

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
            <Calendar className="w-3.5 h-3.5 text-slate-400" /><span>01/05/2024</span><span className="text-slate-400">–</span><span>31/05/2024</span>
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
          <select value={metode} onChange={e=>{ setMetode(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300">
            {["Semua Metode","Transfer Bank","QRIS","Kartu Kredit","Tunai"].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-semibold">Status Verifikasi</label>
          <select value={status} onChange={e=>{ setStatus(e.target.value); setPage(1); }}
            className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300">
            {["Semua Status","Terverifikasi","Menunggu"].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <div className="relative mt-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}
              placeholder="Cari No. Invoice / Siswa"
              className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>{ setSearch(""); setMetode("Semua Metode"); setStatus("Semua Status"); setPage(1); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
            <RefreshCw className="w-3.5 h-3.5" /> Reset Filter
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition shadow-sm shadow-violet-200">
            <Download className="w-3.5 h-3.5" /> Export Laporan
          </button>
        </div>
      </div>

      <p className="px-4 pt-4 pb-2 text-sm font-black text-slate-700">Daftar Pembayaran</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Tanggal Bayar","No. Invoice","Siswa","Metode Pembayaran","Jumlah Bayar","Sisa Tagihan","Status Verifikasi","Aksi"].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-slate-400 font-semibold">Tidak ada data</td></tr>
            ) : rows.map((r, i) => (
              <tr key={`${r.noInv}-${i}`} className={`border-b border-slate-50 hover:bg-violet-50/50 transition-colors ${i%2===0?"":"bg-slate-50/30"}`}>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.tglBayar}</td>
                <td className="px-4 py-3"><span className="text-violet-600 font-bold cursor-pointer hover:underline" onClick={()=>setViewItem(r)}>{r.noInv}</span></td>
                <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{r.customer}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.metode}</td>
                <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{formatRp(r.jumlah)}</td>
                <td className="px-4 py-3 font-semibold whitespace-nowrap">{r.sisa===0?<span className="text-slate-400">Rp 0</span>:<span className="text-amber-600">{formatRp(r.sisa)}</span>}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_VERIF[r.statusVerif]}`}>
                    {r.statusVerif==="Terverifikasi"?<CheckCircle className="w-3 h-3 mr-1"/>:<Hourglass className="w-3 h-3 mr-1"/>}{r.statusVerif}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={()=>setViewItem(r)} title="Lihat Detail"
                      className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-500 hover:text-violet-600 transition"><Eye className="w-4 h-4"/></button>
                    <button onClick={()=>handleDownload(r)} title="Download CSV"
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition"><Download className="w-4 h-4"/></button>
                    <button onClick={()=>setDelItem(r)} title="Hapus"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} totalPages={Math.max(1,pages)} setPage={setPage} total={filtered.length} perPage={PER} />
    </>
  );
}

// ─── TAB 3: Siswa ─────────────────────────────────────────────────────────────
function TabSiswa({ data, onDelete }) {
  const [statusF, setStatusF] = useState("Semua Status");
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [viewItem, setViewItem] = useState(null);
  const [delItem,  setDelItem]  = useState(null);
  const PER = 6;

  const filtered = data.filter(r =>
    (statusF === "Semua Status" || r.status === statusF) &&
    (r.nama.toLowerCase().includes(search.toLowerCase()) || r.pic.toLowerCase().includes(search.toLowerCase()))
  );
  const pages = Math.ceil(filtered.length / PER);
  const rows  = filtered.slice((page - 1) * PER, page * PER);

  const handleDelete = (id) => {
    onDelete(id);
    setDelItem(null);
    if (rows.length === 1 && page > 1) setPage(p => p - 1);
  };
  const handleDownload = (item) => {
    downloadAsCSV(`${item.id}_siswa.csv`,
      ["ID","Nama","PIC","Telepon","Email","Jml Invoice","Total Tagihan","Status"],
      [[item.id, item.nama, item.pic, item.telp, item.email, item.jmlInv, formatRp(item.total), item.status]]
    );
  };

  const donutData = [
    { label:"Aktif",     count: data.filter(d=>d.status==="Aktif").length,     pct:75, color:"#10b981" },
    { label:"Prioritas", count: data.filter(d=>d.status==="Prioritas").length, pct:14, color:"#8b5cf6" },
    { label:"Menunggak", count: data.filter(d=>d.status==="Menunggak").length, pct: 6, color:"#ef4444" },
    { label:"Baru",      count: data.filter(d=>d.status==="Baru").length,      pct: 5, color:"#3b82f6" },
  ];
  const donut = `conic-gradient(${donutData.map((d,i,a) => {
    const start = a.slice(0,i).reduce((s,x)=>s+x.pct,0);
    return `${d.color} ${start}% ${start+d.pct}%`;
  }).join(", ")})`;
  const top5  = [...data].sort((a,b)=>b.total-a.total).slice(0,5);

  return (
    <>
      {viewItem && <SiswaDetailModal item={viewItem} onClose={() => setViewItem(null)} />}
      {delItem  && <ConfirmDeleteModal label={delItem.nama} onConfirm={() => handleDelete(delItem.id)} onCancel={() => setDelItem(null)} />}

      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {[
              { label:"Total Siswa",   value:data.length,                                  sub:"+12% dari periode lalu", ok:true,  Icon:Users,        bg:"bg-violet-100",  ic:"text-violet-600",  money:false },
              { label:"Siswa Aktif",   value:data.filter(d=>d.status==="Aktif").length,    sub:"75% dari total siswa",   ok:true,  Icon:CheckCircle,  bg:"bg-emerald-100", ic:"text-emerald-600", money:false },
              { label:"Siswa Baru",    value:data.filter(d=>d.status==="Baru").length,     sub:"+16% dari periode lalu", ok:true,  Icon:User,         bg:"bg-blue-100",    ic:"text-blue-600",    money:false },
              { label:"Piutang Siswa", value:data.reduce((s,r)=>s+r.total,0),              sub:"28% dari total tagihan", ok:false, Icon:Clock,        bg:"bg-red-100",     ic:"text-red-500",     money:true,  vc:"text-red-500" },
            ].map(({ label, value, sub, ok, bg, ic, vc, money, Icon }, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500">{label}</span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg}`}><Icon className={`w-4 h-4 ${ic}`}/></div>
                </div>
                <p className={`${money?"text-xl":"text-3xl"} font-black ${vc||"text-slate-800"} leading-tight`}>{money?formatRp(value):value}</p>
                <p className={`text-[11px] mt-1.5 font-semibold flex items-center gap-1 ${ok?"text-emerald-600":"text-red-500"}`}>
                  {ok?<TrendingUp className="w-3 h-3"/>:<TrendingDown className="w-3 h-3"/>}{sub}
                </p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <select value={statusF} onChange={e=>{ setStatusF(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300">
              {["Semua Status","Aktif","Prioritas","Menunggak","Baru"].map(s=><option key={s}>{s}</option>)}
            </select>
            <select className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300">
              <option>Semua Kategori</option>
            </select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"/>
              <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }}
                placeholder="Cari nama siswa, PIC, email..."
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"/>
            </div>
            <button onClick={()=>{ setSearch(""); setStatusF("Semua Status"); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">
              <RefreshCw className="w-3.5 h-3.5"/> Reset Filter
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition shadow-sm shadow-violet-200">
              <Plus className="w-3.5 h-3.5"/> Tambah Siswa
            </button>
          </div>

          {/* Table */}
          <p className="px-4 pt-4 pb-2 text-sm font-black text-slate-700">Daftar Siswa</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["ID Siswa","Nama Siswa","PIC / Kontak","Email / WhatsApp","Jml Invoice","Total Tagihan","Status","Aksi"].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length===0?(
                  <tr><td colSpan={8} className="text-center py-10 text-slate-400 font-semibold">Tidak ada data</td></tr>
                ):rows.map((r,i)=>(
                  <tr key={r.id} className={`border-b border-slate-50 hover:bg-violet-50/50 transition-colors ${i%2===0?"":"bg-slate-50/30"}`}>
                    <td className="px-4 py-3 text-violet-600 font-bold">{r.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{r.nama}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-700">{r.pic}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3"/>{r.telp}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <p>{r.email}</p>
                      <p className="flex items-center gap-1 mt-0.5 text-emerald-600"><MessageCircle className="w-3 h-3"/>{r.telp}</p>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">{r.jmlInv}</td>
                    <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{formatRp(r.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_SISWA[r.status]}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={()=>setViewItem(r)} title="Lihat Detail"
                          className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-500 hover:text-violet-600 transition"><Eye className="w-4 h-4"/></button>
                        <button onClick={()=>handleDownload(r)} title="Download CSV"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition"><Download className="w-4 h-4"/></button>
                        <button onClick={()=>setDelItem(r)} title="Hapus"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} totalPages={Math.max(1,pages)} setPage={setPage} total={filtered.length} perPage={PER}/>
        </div>

        {/* Sidebar */}
        <div className="xl:w-64 flex flex-col gap-5 pb-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-sm font-black text-slate-800 mb-4">Ringkasan Siswa</h3>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div style={{ background: donut }} className="w-28 h-28 rounded-full"/>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <span className="text-xs font-black text-slate-700">{data.length}</span>
                  </div>
                </div>
              </div>
              <div className="w-full flex flex-col gap-2">
                {donutData.map((d,i)=>(
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }}/>
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
              {top5.map((s,i)=>(
                <div key={s.id} className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-400 w-4">{i+1}.</span>
                  <span className="text-xs font-semibold text-slate-700 flex-1 leading-tight">{s.nama}</span>
                  <span className="text-xs font-black text-violet-600 whitespace-nowrap">{formatRp(s.total)}</span>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 transition py-2 border border-violet-100 rounded-xl hover:bg-violet-50">
              Lihat Semua Siswa <ArrowRight className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
      </div>
    </>
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
    { label: "Paid",           pct: Math.round(paidCount / total * 100),    color: "#10b981" },
    { label: "Partially Paid", pct: Math.round(partialCount / total * 100), color: "#f59e0b" },
    { label: "Unpaid",         pct: Math.round(unpaidCount / total * 100),  color: "#ef4444" },
    { label: "Overdue",        pct: Math.round(overdueCount / total * 100), color: "#991b1b" },
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
            <div style={{ background: donutGradient }} className="w-20 h-20 rounded-full"/>
            <div className="absolute inset-0 flex items-center justify-center"><div className="w-14 h-14 bg-white rounded-full"/></div>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-[9px] font-bold text-slate-400">Total</span>
              <span className="text-xs font-bold text-slate-800 leading-none">{invoiceData.length}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-xs w-full">
            {pie.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }}/>
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
                <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${i===0?'bg-blue-100 text-blue-600':i===1?'bg-amber-100 text-amber-600':i===2?'bg-emerald-100 text-emerald-600':i===3?'bg-violet-100 text-violet-600':'bg-rose-100 text-rose-600'}`}>{i+1}</div>
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
             <CheckCircle className="w-4 h-4 text-emerald-600"/>
             <span className="text-[10px] font-semibold text-emerald-700">Paid</span>
             <span className="text-xs font-bold text-slate-800">{paidCount}</span>
           </div>
           <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-amber-50 border border-amber-100">
             <Clock className="w-4 h-4 text-amber-600"/>
             <span className="text-[10px] font-semibold text-amber-700">Partial</span>
             <span className="text-xs font-bold text-slate-800">{partialCount}</span>
           </div>
           <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-rose-50 border border-rose-100">
             <AlertCircle className="w-4 h-4 text-rose-600"/>
             <span className="text-[10px] font-semibold text-rose-700">Unpaid</span>
             <span className="text-xs font-bold text-slate-800">{unpaidCount}</span>
           </div>
           <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-red-100/70 border border-red-200">
             <XCircle className="w-4 h-4 text-red-700"/>
             <span className="text-[10px] font-semibold text-red-700">Overdue</span>
             <span className="text-xs font-bold text-slate-800">{overdueCount}</span>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoicePenagihan() {
  
  const [activeTab, setActiveTab] = useState(0);
  
  // Data State
  const [invoices, setInvoices] = useState([]);
  const [terkirim, setTerkirim] = useState([]);
  const [pembayaran, setPembayaran] = useState([]);
  const [siswa, setSiswa] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await axios.get('/api/billing.php');
      if (res.data.status === 'success' && ['invoices','terkirim','pembayaran','siswa'].every(k => Array.isArray(res.data.data?.[k]))) {
        const deletedIds = JSON.parse(localStorage.getItem('deleted_invoice_ids') || '[]');
        const savedCustom = JSON.parse(localStorage.getItem('saved_custom_invoices') || '[]');
        const serverInvs = res.data.data.invoices || [];
        const mergedInvs = [
          ...savedCustom.filter(s => !serverInvs.some(b => b.id === s.id)),
          ...serverInvs
        ].filter(inv => !deletedIds.includes(inv.id));
        const validDefaults = DEFAULT_BLUEPRINT_INVOICES.filter(i => !deletedIds.includes(i.id));
        setInvoices(mergedInvs.length > 0 ? mergedInvs : validDefaults);
        setTerkirim(res.data.data.terkirim || []);
        setPembayaran(res.data.data.pembayaran || []);
        setSiswa(res.data.data.siswa || []);
      } else throw new Error('Respons billing tidak valid.');
    } catch (e) {
      setLoadError(e.response?.data?.message || e.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    axios.get('/api/billing.php').then(({data}) => {
      if (!active) return;
      if (data.status !== 'success' || !['invoices','terkirim','pembayaran','siswa'].every(k => Array.isArray(data.data?.[k]))) throw new Error('Respons billing tidak valid.');
      const deletedIds = JSON.parse(localStorage.getItem('deleted_invoice_ids') || '[]');
      const savedCustom = JSON.parse(localStorage.getItem('saved_custom_invoices') || '[]');
      const serverInvs = data.data.invoices || [];
      const mergedInvs = [
        ...savedCustom.filter(s => !serverInvs.some(b => b.id === s.id)),
        ...serverInvs
      ].filter(inv => !deletedIds.includes(inv.id));
      const validDefaults = DEFAULT_BLUEPRINT_INVOICES.filter(i => !deletedIds.includes(i.id));
      setInvoices(mergedInvs.length > 0 ? mergedInvs : validDefaults);
      setTerkirim(data.data.terkirim);
      setPembayaran(data.data.pembayaran);
      setSiswa(data.data.siswa);
    }).catch(error => { if (active) setLoadError(error.response?.data?.message || error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleDelete = async (type, id) => {
    // 1. Immediately delete from local state
    if (type === 'invoice') {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      
      // Remove from saved_custom_invoices
      const savedCustom = JSON.parse(localStorage.getItem('saved_custom_invoices') || '[]');
      const filteredCustom = savedCustom.filter(s => s.id !== id);
      localStorage.setItem('saved_custom_invoices', JSON.stringify(filteredCustom));

      // Track in deleted_invoice_ids so default blueprint mock items never reappear
      const deletedIds = JSON.parse(localStorage.getItem('deleted_invoice_ids') || '[]');
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        localStorage.setItem('deleted_invoice_ids', JSON.stringify(deletedIds));
      }
    } else if (type === 'terkirim') {
      setTerkirim(prev => prev.filter(t => t.id !== id));
    } else if (type === 'pembayaran') {
      setPembayaran(prev => prev.filter(p => p.id !== id && p.noInv !== id));
    } else if (type === 'siswa') {
      setSiswa(prev => prev.filter(s => s.id !== id && s.nama !== id));
    }

    // 2. Call backend DELETE
    try {
      await axios.delete(`/api/billing.php?type=${type}&id=${id}`);
    } catch (e) {
      console.warn('Backend delete fallback:', e);
    }

    // 3. Re-sync data
    fetchData();
  };

  const [showBuatRoot, setShowBuatRoot] = useState(false);

  if (loading || loadError) return <Layout><div className="rounded-xl bg-white p-6"><p role={loadError?'alert':'status'}>{loadError || 'Memuat billing…'}</p>{loadError && <button onClick={fetchData}>Coba lagi</button>}</div></Layout>;
  
  const totalTagihan = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
  const paidInvs     = invoices.filter(i => normalizeFinanceStatus(i.status) === "Paid");
  const paidNominal  = paidInvs.reduce((s, i) => s + Number(i.total || 0), 0);
  const partInvs     = invoices.filter(i => normalizeFinanceStatus(i.status) === "Partially Paid");
  const partNominal  = partInvs.reduce((s, i) => s + Number(i.total || 0), 0);
  const unpaidInvs   = invoices.filter(i => {
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
                className={`py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  activeTab === i
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
            {activeTab === 0 && <TabDaftarInvoice data={invoices} onDelete={(id) => handleDelete('invoice', id)} dataSiswa={siswa} onRefresh={fetchData} />}
            {activeTab === 1 && <TabInvoiceTerkirim data={terkirim} onDelete={(id) => handleDelete('terkirim', id)} />}
            {activeTab === 2 && <TabPembayaran data={pembayaran} onDelete={(id) => handleDelete('pembayaran', id)} />}
            {activeTab === 3 && <div className="p-6"><TabSiswa data={siswa} onDelete={(id) => handleDelete('siswa', id)} /></div>}
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
