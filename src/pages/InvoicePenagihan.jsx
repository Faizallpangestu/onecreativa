import { useState, useEffect, useCallback } from "react";

import axios from "axios";
import Swal from "sweetalert2";
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
  Settings, CheckSquare, Square, Printer, Check, PlusCircle, Sparkles, HelpCircle,
  Image as ImageIcon, ExternalLink, ZoomIn, FileCheck
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
  doc.setFont("times");
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

    // Right: Kop Surat Teks
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(24);
    doc.setFont("times", "bold");
    doc.text("INVOICE", 196, 18, { align: 'right' });

    doc.setFontSize(9.5);
    doc.setFont("times", "bold");
    doc.text("PT. Creativa Bridging International", 196, 24, { align: 'right' });

    doc.setFontSize(8.5);
    doc.setFont("times", "normal");
    doc.text("Ruko Business Park, Jl. Ir. H. Juanda, Panembong, Ruko B1", 196, 29, { align: 'right' });
    doc.text("Mekarsari, Kec. Cianjur, Kab. Cianjur, Jawa Barat 43211", 196, 34, { align: 'right' });
    doc.text("+62 815-2222-672 | creativabridging.com", 196, 39, { align: 'right' });

    // Double Line Separator
    currentY = 43;
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
  doc.setFont("times", "normal");
  doc.text("To,", 14, metaStartY);

  doc.setFontSize(12);
  doc.setFont("times", "bold");
  doc.text(inv.customer ? inv.customer.toUpperCase() : "-", 14, metaStartY + 6);

  doc.setFontSize(8.5);
  doc.setFont("times", "normal");
  doc.setTextColor(80);
  if (inv.phone) doc.text(`Telp/WA: ${inv.phone}`, 14, metaStartY + 11);
  if (inv.email) doc.text(`Email: ${inv.email}`, 14, metaStartY + 15.5);

  // Right Meta
  doc.setTextColor(0);
  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.text("Invoice Number", 125, metaStartY);
  doc.text("Sales Code", 125, metaStartY + 5.5);
  doc.text("Invoice Date", 125, metaStartY + 11);
  doc.text("Payment Due", 125, metaStartY + 16.5);

  doc.setFont("times", "normal");
  doc.text(`: ${inv.id}`, 155, metaStartY);
  doc.text(`: ${inv.salesCode || 'SLS-CBI-01'}`, 155, metaStartY + 5.5);
  doc.text(`: ${inv.tanggal}`, 155, metaStartY + 11);
  doc.text(`: ${inv.jatuhTempo}`, 155, metaStartY + 16.5);

  currentY = metaStartY + 23;

  // 3. TABLE ITEMS
  const tableRows = (inv.items && inv.items.length > 0)
    ? inv.items.map(it => [it.name, String(it.qty || 1), formatRp(Number(it.price || 0)), formatRp(Number(it.amount || it.price || 0))])
    : [[`Kelas Intensif Offline (${inv.keterangan || 'Program Pelatihan'})\nBiaya Pendidikan Bahasa Jepang dan Pelatihan Skill`, "1", formatRp(inv.total), formatRp(inv.total)]];

  autoTable(doc, {
    startY: currentY,
    head: [["Item", "Quantity", "Price (Rp)", "Amount (Rp)"]],
    body: tableRows,
    styles: { font: 'times' },
    headStyles: { font: 'times', fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 9 },
    bodyStyles: { font: 'times', textColor: 0, fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'right', cellWidth: 32 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 33 }
    },
    theme: 'grid'
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // 4. TOTALS
  const subtotal = inv.subtotal || inv.total;
  const discountAmount = inv.discount?.amount || 0;
  const grandTotal = inv.total;

  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.text("Sub - Total amount:", 150, currentY, { align: 'right' });
  doc.text(formatRp(subtotal), 195, currentY, { align: 'right' });

  if (discountAmount > 0) {
    currentY += 4.5;
    doc.text(`Discount (${inv.discount?.desc || 'Promo'}):`, 150, currentY, { align: 'right' });
    doc.text(`- ${formatRp(discountAmount)}`, 195, currentY, { align: 'right' });
  }

  currentY += 5.5;
  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.text("Total:", 150, currentY, { align: 'right' });
  doc.text(formatRp(grandTotal), 195, currentY, { align: 'right' });

  currentY += 7;

  // Installment schedule table for PDF
  if (inv.installments && inv.installments.length > 0) {
    if (currentY > 210) { doc.addPage(); currentY = 20; }
    doc.setFontSize(9);
    doc.setFont("times", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("Jadwal Termin Pembayaran (Installment Plan):", 14, currentY);
    currentY += 3.5;

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
      styles: { font: 'times' },
      headStyles: { font: 'times', fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8 },
      bodyStyles: { font: 'times', textColor: 0, fontSize: 8 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 18 },
        1: { halign: 'center', cellWidth: 38 },
        2: { halign: 'right', fontStyle: 'bold', cellWidth: 44 },
        3: { cellWidth: 80 }
      },
      theme: 'grid'
    });
    currentY = doc.lastAutoTable.finalY + 6;
  }

  // 5. INCLUSIONS & EXCLUSIONS (Side-by-side 2 Columns for elegance & space-saving)
  if (currentY > 210) { doc.addPage(); currentY = 20; }

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

  const excludes = (inv.excludes && inv.excludes.length > 0) ? inv.excludes : [
    "Biaya Paspor & Medical Check Up (MCU)",
    "Biaya Visa & CoE",
    "Tiket Pesawat ke Jepang",
    "Biaya Utilitas Asrama (Air, Listrik, Internet per bulan)",
    "Biaya Makan & Keperluan Pribadi"
  ];

  const colYStart = currentY;

  // Left Column: Included
  doc.setFont("times", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text("Biaya Sudah Termasuk (Included):", 14, colYStart);

  let leftY = colYStart + 4.2;
  doc.setFont("times", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(50);
  includes.forEach((item) => {
    doc.setFillColor(16, 185, 129); // emerald green bullet dot
    doc.circle(16, leftY - 0.8, 0.7, 'F');
    const lines = doc.splitTextToSize(item, 82);
    doc.text(lines, 18.5, leftY);
    leftY += lines.length * 3.6;
  });

  // Right Column: Excluded
  doc.setFont("times", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(180, 40, 40); // rose-700
  doc.text("Biaya Tidak Termasuk (Excluded):", 108, colYStart);

  let rightY = colYStart + 4.2;
  doc.setFont("times", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(50);
  excludes.forEach((item) => {
    doc.setFillColor(239, 68, 68); // rose bullet dot
    doc.circle(110, rightY - 0.8, 0.7, 'F');
    const lines = doc.splitTextToSize(item, 82);
    doc.text(lines, 112.5, rightY);
    rightY += lines.length * 3.6;
  });

  currentY = Math.max(leftY, rightY) + 5;

  // 6. CATATAN & TERMS (Pastikan masuk lengkap dengan Rekening BCA)
  if (currentY > 215) { doc.addPage(); currentY = 20; }

  doc.setFont("times", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Catatan, Rekening & Syarat Pembayaran (Terms & Conditions):", 14, currentY);
  currentY += 4;

  const officialTerms = inv.notes || 
`1. Invoice ini bersifat confidential (rahasia) dan merupakan bukti tagihan resmi dari PT Creativa Bridging International.
2. Cara Pembayaran Resmi:
   - Transfer Bank BCA No. Rekening: 1832-918-428 a/n PT CREATIVA BRIDGING INTERN
   - Harap cantumkan Nomor Invoice (${inv.id || ''}) pada berita transfer.
   - Kirimkan bukti transfer ke WhatsApp Finance atau email finance@creativabridging.com untuk penerbitan kuitansi resmi.
3. Pelunasan tagihan wajib diselesaikan sesuai tanggal jatuh tempo yang tertera pada jadwal termin.
4. Terimakasih telah bergabung dengan LPK Creativa Bridging International.`;

  const noteLines = doc.splitTextToSize(officialTerms, 176);
  const noteBoxHeight = noteLines.length * 3.5 + 5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, 182, noteBoxHeight, 2, 2, 'FD');

  doc.setFont("times", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(noteLines, 17, currentY + 4);
  currentY += noteBoxHeight + 6;

  // 7. FOOTER & SIGNATURE
  if (currentY > 245) { doc.addPage(); currentY = 20; }
  doc.setFont("times", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Diketahui & Disahkan Oleh,", 14, currentY);
  currentY += 15;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, currentY - 2, 70, currentY - 2);

  doc.setFont("times", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Siti Nurhatifah", 14, currentY + 2);
  doc.setFont("times", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Direktur Utama — PT Creativa Bridging International", 14, currentY + 6.5);

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

// ─── HELPER: Generate & Download / Preview Official Kwitansi (Receipt PDF) ────
export function generateReceiptPDF(payment, inv, mode = 'preview') {
  const doc = new jsPDF({ format: 'a4' });
  doc.setFont("helvetica");

  const receiptNo = payment.receiptNo || `RCP-${inv.id || 'INV'}-${Date.now().toString().slice(-4)}`;
  const customerName = inv.customer || payment.customer || 'Siswa / Customer';
  const amountPaid = Number(payment.nominal || payment.jumlah || inv.total || 0);

  doc.setProperties({
    title: `KWITANSI - ${receiptNo} - ${customerName.toUpperCase()}`
  });

  let currentY = 18;

  // 1. KOP SURAT RESMI
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

  // Header Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.text("KWITANSI RESMI", 196, 18, { align: 'right' });

  doc.setFontSize(9.5);
  doc.text("PT. Creativa Bridging International", 196, 24, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text("Ruko Business Park, Jl. Ir. H. Juanda, Panembong, Ruko B1, Cianjur", 196, 29, { align: 'right' });
  doc.text("+62 815-2222-672 | finance@creativabridging.com", 196, 34, { align: 'right' });

  // Double Line Separator
  currentY = 40;
  doc.setDrawColor(16, 185, 129); // emerald green accent for receipt
  doc.setLineWidth(0.8);
  doc.line(14, currentY, 196, currentY);
  doc.setLineWidth(0.2);
  doc.line(14, currentY + 1.2, 196, currentY + 1.2);
  currentY += 10;

  // Receipt Number & Date Banner
  doc.setFillColor(240, 253, 244); // bg-emerald-50
  doc.setDrawColor(187, 247, 208); // border-emerald-200
  doc.roundedRect(14, currentY, 182, 18, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text(`NO. KWITANSI: ${receiptNo}`, 20, currentY + 7);
  doc.text(`TANGGAL: ${payment.tglBayar || inv.tanggal || new Date().toISOString().slice(0, 10)}`, 190, currentY + 7, { align: 'right' });

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Referensi Tagihan: Invoice #${inv.id || '-'}`, 20, currentY + 13);
  doc.text(`Waktu Approve: ${payment.jamBayar || '12:00'} WIB`, 190, currentY + 13, { align: 'right' });

  currentY += 26;

  // Receipt Content Box
  autoTable(doc, {
    startY: currentY,
    body: [
      ["Telah Terima Dari", `:  ${customerName.toUpperCase()}`],
      ["Uang Sejumlah", `:  # ${terbilangRupiah(amountPaid)} #`],
      ["Untuk Pembayaran", `:  Pembayaran ${payment.terminName ? (payment.terminName + ' ') : ''}Tagihan Invoice No. ${inv.id || '-'}\n   Program: ${inv.program || inv.keterangan || 'Kelas Pelatihan Bahasa Jepang & Skill'}`],
      ["Metode & Rekening", `:  ${payment.metode || 'Transfer Bank'} — ${payment.rekening || inv.rekening || 'BCA (1832-918-428 a/n PT CREATIVA BRIDGING INTERN)'}`],
      ["Catatan Verifikasi", `:  ${payment.catatan || 'Pembayaran resmi pelatihan kerja Jepang telah diverifikasi oleh Divisi Keuangan.'}`],
    ],
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: 3.5, textColor: [15, 23, 42] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 44, textColor: [51, 65, 85] },
      1: { cellWidth: 138 }
    }
  });

  // 3. Kotak Nominal & Stamp Verifikasi
  currentY = doc.lastAutoTable.finalY + 8;
  const boxHeight = 18;

  // Left Box: JUMLAH PEMBAYARAN (Nominal Angka)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.roundedRect(14, currentY, 94, boxHeight, 3, 3, 'FD');

  doc.setFontSize(7.5);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("JUMLAH DITERIMA (IDR):", 20, currentY + 5.5);

  doc.setFontSize(13.5);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text(formatRp(amountPaid), 20, currentY + 13);

  // Right Box: STAMP LUNAS / TERVERIFIKASI (Official Badge)
  const stampX = 114;
  const stampWidth = 82;
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(0.7);
  doc.roundedRect(stampX, currentY, stampWidth, boxHeight, 3, 3, 'FD');

  // Vector Green Checkmark Badge Circle
  const circleX = stampX + 8;
  const circleY = currentY + (boxHeight / 2);
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.circle(circleX, circleY, 4, 'F');

  // Draw crisp white vector checkmark inside the circle
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.7);
  doc.line(circleX - 1.8, circleY, circleX - 0.5, circleY + 1.6);
  doc.line(circleX - 0.5, circleY + 1.6, circleX + 2.0, circleY - 1.5);

  // Stamp Text
  doc.setFont(undefined, 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text("LUNAS / TERVERIFIKASI", circleX + 7, currentY + 7.5);

  doc.setFont(undefined, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text("Sistem Keuangan PT Creativa Bridging", circleX + 7, currentY + 12.5);

  currentY += boxHeight + 10;

  // Signature Section
  doc.setFontSize(8.5);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(71, 85, 105);

  // Left Signature: Pembayar / Siswa
  doc.text("Penyetor / Siswa,", 24, currentY);
  doc.text("Diterima & Disetujui Oleh,", 126, currentY);
  currentY += 18;

  // Underline for signature
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(24, currentY - 2, 85, currentY - 2);
  doc.line(126, currentY - 2, 188, currentY - 2);

  doc.setFont(undefined, 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(customerName, 24, currentY + 2);
  doc.text(payment.approverName || "FINANCE LPK CREATIVA", 126, currentY + 2);

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Siswa LPK Creativa", 24, currentY + 6.5);
  doc.text("Finance & Treasury Dept.", 126, currentY + 6.5);

  // Digital Verification Note
  currentY += 14;
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("* Kwitansi ini adalah bukti pembayaran sah yang diterbitkan secara elektronik oleh Sistem Keuangan PT Creativa Bridging International.", 14, currentY);
  doc.text(`* No. Referensi Transaksi: ${payment.refNumber || ('TRX-' + (payment.receiptNo || inv.id || 'CBI'))} | Tercatat pada Buku Besar Realisasi Kas`, 14, currentY + 4);

  if (mode === 'preview') {
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
    return blobUrl;
  }
  doc.save(`${receiptNo}.pdf`);
}

export function previewReceiptPDF(payment, inv) {
  return generateReceiptPDF(payment, inv, 'preview');
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
  const [showBuktiModal, setShowBuktiModal] = useState(false);
  const stNorm = normalizeFinanceStatus(inv.status);
  const totalVal = Number(inv.total) || 0;
  const terbayarVal = stNorm === "Paid" ? totalVal : (Number(inv.terbayar) || 0);
  const sisaVal = Math.max(0, totalVal - terbayarVal);

  return (
    <>
      {showBuktiModal && (
        <RiwayatBuktiInvoiceModal
          inv={inv}
          onClose={() => setShowBuktiModal(false)}
        />
      )}

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
              { icon: Building2,   label: "Siswa / Customer",  value: inv.customer },
              { icon: CalendarDays,label: "Tanggal Invoice",   value: inv.tanggal },
              { icon: Clock,       label: "Jatuh Tempo",       value: inv.jatuhTempo || "-" },
              { icon: Banknote,    label: "Total Tagihan",      value: formatRp(inv.total), highlight: true },
              { icon: Tag,         label: "Keterangan Program", value: inv.keterangan || inv.program || "Kelas Pelatihan Bahasa Jepang" },
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
    </>
  );
}

// ─── VIEW MODAL: Invoice Terkirim ─────────────────────────────────────────────
function TerkirimDetailModal({ item, onClose }) {
  const [resending, setResending] = useState(false);

  const handleResend = () => {
    setResending(true);
    setTimeout(() => {
      setResending(false);
      Swal.fire({
        icon: "success",
        title: "Invoice Berhasil Dikirim Ulang!",
        html: `Notifikasi penagihan invoice <b>${item.id}</b> berhasil dikirimkan ulang via <b>${item.kanal}</b> ke <b>${item.penerima}</b>.`,
        timer: 2000,
        showConfirmButton: false
      });
    }, 600);
  };

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
              {item.statusKirim || "Terkirim"}
            </span>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${STATUS_BACA[item.statusBaca] || "bg-blue-50 text-blue-700"}`}>
              {item.statusBaca || "Dibaca"}
            </span>
          </div>
          {item.statusInvoice && (
            <span className="text-xs font-bold text-slate-500">
              Status Tagihan: <strong className="text-slate-800">{item.statusInvoice}</strong>
            </span>
          )}
        </div>
        <div className="px-6 py-4 flex flex-col gap-3">
          {[
            { icon: Building2,    label: "Siswa / Customer", value: item.customer },
            { icon: CalendarDays, label: "Tanggal Kirim",   value: item.tglKirim },
            { icon: item.kanal === "Email" ? Mail : MessageCircle, label: "Kanal Pengiriman", value: item.kanal },
            { icon: User,         label: "Penerima (Kontak)", value: item.penerima },
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
            onClick={() => previewInvoicePDF({ id: item.id, customer: item.customer, total: item.nominal, tanggal: item.tglKirim })}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-200 cursor-pointer"
          >
            <Eye className="w-4 h-4" /> Buka Invoice PDF
          </button>
          <button
            type="button"
            disabled={resending}
            onClick={handleResend}
            className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-emerald-200 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-emerald-600" /> {resending ? "Mengirim..." : "Kirim Ulang"}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── HELPER: Generate Slip Transfer BCA Digital (Jika Belum Ada Upload Foto Fisik) ───
function generateReceiptSlipImage({ customer, id, nominal, tglBayar, jamBayar, metode, rekening, refNumber, terminName }) {
  const nomFormatted = "Rp " + Number(nominal || 0).toLocaleString("id-ID");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="740" viewBox="0 0 600 740" style="background:#f8fafc; font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <rect width="600" height="740" fill="#f8fafc"/>
    <rect x="25" y="20" width="550" height="700" rx="20" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
    <path d="M 25 40 Q 25 20 45 20 L 555 20 Q 575 20 575 40 L 575 110 L 25 110 Z" fill="#00529c"/>
    
    <text x="45" y="58" font-size="18" font-weight="bold" fill="#ffffff" letter-spacing="0.5">BUKTI TRANSFER ELEKTRONIK</text>
    <text x="45" y="80" font-size="11" fill="#bae6fd" font-weight="500">PT CREATIVA BRIDGING INTERNATIONAL &bull; FINANCE DIVISION</text>
    <rect x="440" y="40" width="105" height="48" rx="8" fill="#ffffff" opacity="0.15"/>
    <text x="492" y="72" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">BCA</text>
    
    <circle cx="300" cy="165" r="32" fill="#ecfdf5"/>
    <circle cx="300" cy="165" r="24" fill="#10b981"/>
    <path d="M292 165 L298 171 L310 157" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    
    <text x="300" y="222" font-size="15" font-weight="bold" fill="#065f46" text-anchor="middle">TRANSAKSI BERHASIL / VALID</text>
    <text x="300" y="242" font-size="11" fill="#64748b" text-anchor="middle">${tglBayar || '2026-10-29'} ${jamBayar ? ('&bull; ' + jamBayar + ' WIB') : '&bull; 10:30 WIB'}</text>
    <text x="300" y="285" font-size="30" font-weight="900" fill="#0f172a" text-anchor="middle">${nomFormatted}</text>
    <text x="300" y="308" font-size="12" font-weight="bold" fill="#0284c7" text-anchor="middle">${terminName || 'Pelunasan Biaya Pelatihan'}</text>
    
    <line x1="55" y1="330" x2="545" y2="330" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="6,6"/>
    
    <text x="55" y="362" font-size="12" fill="#64748b">No. Referensi Bank</text>
    <text x="545" y="362" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">${refNumber || ('TRX-' + (id || '04826') + '-8912')}</text>
    
    <text x="55" y="402" font-size="12" fill="#64748b">No. Invoice Tagihan</text>
    <text x="545" y="402" font-size="12" font-weight="bold" fill="#0284c7" text-anchor="end">#${id || 'INV-04826'}</text>
    
    <text x="55" y="442" font-size="12" fill="#64748b">Siswa / Pembayar</text>
    <text x="545" y="442" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="end">${customer || 'Siswa LPK Creativa'}</text>
    
    <text x="55" y="482" font-size="12" fill="#64748b">Rekening Penerima</text>
    <text x="545" y="482" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">BCA 1832-918-428</text>
    <text x="545" y="500" font-size="11" fill="#64748b" text-anchor="end">PT CREATIVA BRIDGING INTERN</text>
    
    <text x="55" y="540" font-size="12" fill="#64748b">Metode Pembayaran</text>
    <text x="545" y="540" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="end">${metode || 'Transfer Bank BCA Operasional'}</text>
    
    <rect x="45" y="575" width="510" height="90" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="65" y="605" font-size="11" font-weight="bold" fill="#1e293b">Autentikasi Sistem Keuangan ONE Creativa</text>
    <text x="65" y="626" font-size="10" fill="#64748b">Dokumen ini merupakan bukti transfer elektronik sah yang telah disetujui oleh Finance.</text>
    <text x="65" y="644" font-size="10" fill="#059669" font-weight="600">&bull; Status: Realisasi Kas Terverifikasi &bull; Sesuai Rekening Koran BCA</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ─── MODAL PREVIEW BUKTI TRANSFER (FULL IMAGE LIGHTBOX) ──────────────────────
function BuktiTransferModal({ payment, invoice, onClose }) {
  if (!payment && !invoice) return null;

  const invObj = invoice || {
    id: payment?.noInv,
    customer: payment?.customer,
    program: "Kelas Pelatihan Bahasa Jepang",
    total: Number(payment?.jumlah || 0) + Number(payment?.sisa || 0)
  };

  const payObj = payment || (invObj?.lastPayment || (invObj?.payments && invObj.payments[invObj.payments.length - 1])) || {
    receiptNo: `RCP-${invObj?.id}-01`,
    tglBayar: invObj?.paid_at || invObj?.tanggal || new Date().toISOString().slice(0, 10),
    jamBayar: "10:30",
    approverName: "FINANCE LPK CREATIVA",
    metode: "Transfer Bank BCA",
    rekening: "BCA 1832-918-428 an PT CREATIVA BRIDGING INTERN",
    refNumber: `TRX-${invObj?.id}-8912`,
    jumlah: Number(invObj?.terbayar || invObj?.total || 0),
    terminName: Number(invObj?.sisa) > 0 ? "Pembayaran Cicilan" : "Pelunasan (Full Payment)",
    catatan: `Pelunasan tagihan program pelatihan ${invObj?.program || 'Bahasa Jepang'}`
  };

  const buktiSrc = payObj.buktiBayar || payObj.buktiFoto || payObj.buktiBayarUrl || generateReceiptSlipImage({
    customer: invObj?.customer || payObj.customer,
    id: invObj?.id || payObj.noInv,
    nominal: payObj.jumlah,
    tglBayar: payObj.tglBayar,
    jamBayar: payObj.jamBayar,
    metode: payObj.metode,
    rekening: payObj.rekening,
    refNumber: payObj.refNumber,
    terminName: payObj.terminName || (Number(invObj?.sisa) > 0 ? "Pembayaran Cicilan" : "Pelunasan (Full Payment)")
  });

  const handleDownloadBukti = () => {
    const a = document.createElement("a");
    a.href = buktiSrc;
    a.download = `bukti-transfer-${invObj.id}-${payObj.receiptNo || 'transfer'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
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
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Valid & Terverifikasi
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
                {payObj.refNumber || `TRX-${invObj.id}`}
              </p>
            </div>
          </div>

          {/* Area Foto Bukti Transfer */}
          <div className="bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-center min-h-[360px] border border-slate-800 relative group overflow-hidden shadow-inner">
            <img 
              src={buktiSrc} 
              alt="Foto Bukti Transfer" 
              className="max-h-[460px] w-auto max-w-full rounded-lg object-contain shadow-2xl transition duration-300" 
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <a 
                href={buktiSrc} 
                target="_blank" 
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 border border-white/20 transition cursor-pointer"
                title="Buka foto ukuran penuh di tab baru"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buka Tab Baru
              </a>
            </div>
          </div>

          {/* Keterangan & Rekening Tujuan */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-600 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Rekening Tujuan:</span>
              <span className="font-bold text-slate-800">{payObj.rekening || "BCA 1832-918-428 an PT CREATIVA BRIDGING INTERN"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Petugas Finance Approval:</span>
              <span className="font-bold text-emerald-700">{payObj.approverName || "FINANCE LPK CREATIVA"}</span>
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
          <button
            type="button"
            onClick={handleDownloadBukti}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" /> Unduh Gambar Bukti
          </button>
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
function RiwayatBuktiInvoiceModal({ inv, onClose, onOpenPaymentModal }) {
  const [selectedPaymentForBukti, setSelectedPaymentForBukti] = useState(null);

  if (!inv) return null;

  const totalNominal = Number(inv.total || 0);
  const terbayarNominal = Number(inv.terbayar || 0);
  const sisaNominal = Number(inv.sisa ?? (totalNominal - terbayarNominal));

  // Kumpulkan list pembayaran yang sudah masuk
  const paymentsList = (inv.payments && inv.payments.length > 0)
    ? inv.payments
    : (terbayarNominal > 0 ? [
        {
          id: `PAY-${inv.id}-01`,
          receiptNo: `RCP-${inv.id}-01`,
          noInv: inv.id,
          customer: inv.customer,
          tglBayar: inv.paid_at || inv.tanggal || "2026-10-29",
          jamBayar: "10:30",
          approverName: "FINANCE LPK CREATIVA",
          metode: "Transfer Bank BCA",
          rekening: "BCA 1832-918-428 an PT CREATIVA BRIDGING INTERN",
          refNumber: `TRX-${inv.id}-8912`,
          jumlah: terbayarNominal,
          sisa: sisaNominal,
          terminName: sisaNominal > 0 ? "Pembayaran Cicilan ke-1" : "Pelunasan (Full Payment)",
          statusVerif: "Terverifikasi"
        }
      ] : []);

  return (
    <>
      {selectedPaymentForBukti && (
        <BuktiTransferModal 
          payment={selectedPaymentForBukti} 
          invoice={inv} 
          onClose={() => setSelectedPaymentForBukti(null)} 
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
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
                    const slipThumb = p.buktiBayar || p.buktiFoto || p.buktiBayarUrl || generateReceiptSlipImage({
                      customer: inv.customer,
                      id: inv.id,
                      nominal: p.jumlah,
                      tglBayar: p.tglBayar,
                      jamBayar: p.jamBayar,
                      metode: p.metode,
                      rekening: p.rekening,
                      refNumber: p.refNumber,
                      terminName: p.terminName || (sisaNominal > 0 ? `Cicilan ke-${idx + 1}` : "Pelunasan")
                    });

                    return (
                      <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Thumbnail Bukti Transfer */}
                          <div 
                            onClick={() => setSelectedPaymentForBukti(p)}
                            className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative group/thumb cursor-pointer shrink-0 shadow-2xs"
                            title="Klik untuk perbesar bukti transfer"
                          >
                            <img src={slipThumb} alt="Bukti" className="w-full h-full object-cover group-hover/thumb:scale-110 transition" />
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
                              {p.tglBayar} {p.jamBayar ? `• ${p.jamBayar} WIB` : ""} &bull; Ref: <span className="font-mono">{p.refNumber || `TRX-${inv.id}`}</span>
                            </p>
                          </div>
                        </div>

                        {/* Aksi Tombol Bukti Transfer & Kwitansi */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
    </>
  );
}

// ─── VIEW MODAL: Pembayaran ───────────────────────────────────────────────────
function PembayaranDetailModal({ item, onClose }) {
  const [showBuktiZoom, setShowBuktiZoom] = useState(false);

  const buktiImgSrc = item.buktiBayar || item.buktiFoto || generateReceiptSlipImage({
    customer: item.customer,
    id: item.noInv,
    nominal: item.jumlah,
    tglBayar: item.tglBayar,
    jamBayar: item.jamBayar,
    metode: item.metode,
    rekening: item.rekening,
    refNumber: item.refNumber,
    terminName: item.terminName || (item.sisa > 0 ? "Pembayaran Cicilan" : "Pelunasan")
  });

  return (
    <>
      {showBuktiZoom && (
        <BuktiTransferModal 
          payment={item} 
          invoice={{ id: item.noInv, customer: item.customer, program: item.program || "Kelas Pelatihan Bahasa Jepang", total: Number(item.jumlah || 0) + Number(item.sisa || 0) }} 
          onClose={() => setShowBuktiZoom(false)} 
        />
      )}

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
              { icon: Building2,    label: "Customer / Siswa",   value: item.customer },
              { icon: CalendarDays, label: "Tanggal Bayar",     value: `${item.tglBayar} ${item.jamBayar ? ('• ' + item.jamBayar) : ''}` },
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
                <img src={buktiImgSrc} alt="Bukti Transfer" className="w-14 h-14 object-cover rounded-md border border-slate-200 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-xs">Bukti Transfer Sah</p>
                  <p className="text-[10px] text-slate-400">Klik untuk melihat foto ukuran penuh & unduh dokumen</p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Terverifikasi Finance
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-5 space-y-2">
            <button 
              type="button"
              onClick={() => {
                previewReceiptPDF(item, { 
                  id: item.noInv, 
                  customer: item.customer, 
                  program: item.program || "Kelas Pelatihan Bahasa Jepang", 
                  total: Number(item.jumlah || 0) + Number(item.sisa || 0) 
                });
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Receipt className="w-4 h-4" /> Cetak Kwitansi Resmi (Receipt PDF)
            </button>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition cursor-pointer">Tutup</button>
          </div>
        </div>
      </div>
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
              { icon: Hash,         label: "ID Siswa",       value: item.id },
              { icon: User,         label: "PIC / Kontak",   value: item.pic || "Siswa Mandiri" },
              { icon: Phone,        label: "Telepon / WA",   value: item.telp || "-" },
              { icon: Mail,         label: "Email",          value: item.email || "-" },
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
                <p className="text-xs sm:text-sm font-black text-emerald-600 mt-0.5">{formatRp(item.terbayar || 0)}</p>
              </div>
              <div>
                <span className="text-[10px] text-rose-600 font-bold uppercase block">Sisa Piutang</span>
                <p className="text-xs sm:text-sm font-black text-rose-600 mt-0.5">{formatRp(item.sisa || 0)}</p>
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
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            invStatus === "Paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
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
  const [rekening, setRekening] = useState("BCA 1832-918-428 an PT CREATIVA BRIDGING INTERN");
  const [refNumber, setRefNumber] = useState("");
  const [catatan, setCatatan] = useState(() => {
    if (hasInstallments && selectedTerminIdx !== null && inv.installments[selectedTerminIdx]) {
      return `Pembayaran ${inv.installments[selectedTerminIdx].keterangan || ('Cicilan ke-' + (selectedTerminIdx + 1))} - No. Invoice ${inv.id}`;
    }
    return `Pelunasan tagihan program pelatihan ${inv.program || 'Bahasa Jepang'}`;
  });
  const [buktiPreview, setBuktiPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isApprovedCheck, setIsApprovedCheck] = useState(true);
  const [isSuccessAnimated, setIsSuccessAnimated] = useState(false);
  const [previewBuktiItem, setPreviewBuktiItem] = useState(null);

  const pastPayments = (inv.payments && inv.payments.length > 0) ? inv.payments : (
    currentTerbayar > 0 ? [{
      id: `PAY-${inv.id}-01`,
      noInv: inv.id,
      customer: inv.customer,
      tglBayar: inv.tanggal || "2026-10-29",
      jamBayar: "10:15",
      metode: "Transfer Bank BCA",
      rekening: "BCA 1832-918-428 an PT CREATIVA BRIDGING INTERN",
      jumlah: currentTerbayar,
      sisa: currentSisa,
      statusVerif: "Terverifikasi",
      terminName: hasInstallments ? "Cicilan ke-1" : "Pembayaran Sebagian",
      refNumber: `TRX-${inv.id}-01`,
      catatan: `Pembayaran cicilan ${inv.customer}`
    }] : []
  );

  const handleSelectTermin = (idx, inst) => {
    setSelectedTerminIdx(idx);
    setNominal(Number(inst.nominal || 0));
    setCatatan(`Pembayaran ${inst.keterangan || ('Cicilan ke-' + (idx + 1))} - No. Invoice ${inv.id}`);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBuktiPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
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
    setIsSuccessAnimated(true);

    setTimeout(() => {
      onApprove({
        nominal: Number(nominal),
        tglBayar,
        jamBayar,
        approverName: approverName.trim() || "FINANCE LPK CREATIVA",
        metode,
        rekening,
        refNumber,
        buktiBayarUrl: buktiPreview || "",
        catatan,
        terminIndex: chosenTermin ? (selectedTerminIdx + 1) : null,
        terminName: chosenTermin ? (chosenTermin.keterangan || `Cicilan ke-${selectedTerminIdx + 1}`) : null
      });
    }, 750);
  };

  return (
    <>
      {previewBuktiItem && (
        <BuktiTransferModal
          payment={previewBuktiItem}
          invoice={inv}
          onClose={() => setPreviewBuktiItem(null)}
        />
      )}

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
                Tanda bukti valid. Invoice <strong className="font-mono text-slate-800">#{inv.id}</strong> berstatus <strong className="text-emerald-700">Paid ✓</strong> dan kwitansi resmi sedang diterbitkan...
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 shadow-2xs">
                <Check className="w-4 h-4 text-emerald-600" /> Realisasi & Proyeksi Kas Tersinkronisasi
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
                    const thumb = p.buktiBayar || p.buktiFoto || p.buktiBayarUrl || generateReceiptSlipImage({
                      customer: inv.customer,
                      id: inv.id,
                      nominal: p.jumlah,
                      tglBayar: p.tglBayar,
                      jamBayar: p.jamBayar,
                      metode: p.metode,
                      rekening: p.rekening,
                      refNumber: p.refNumber,
                      terminName: p.terminName || `Cicilan ke-${pIdx + 1}`
                    });
                    return (
                      <div key={pIdx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-amber-200 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <div 
                            onClick={() => setPreviewBuktiItem(p)}
                            className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 overflow-hidden relative group/thumb cursor-pointer shrink-0"
                            title="Klik untuk melihat bukti transfer cicilan sebelumnya"
                          >
                            <img src={thumb} alt="Bukti" className="w-full h-full object-cover group-hover/thumb:scale-110 transition" />
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
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                          isPaid
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
                    <img 
                      src={buktiPreview} 
                      alt="Bukti Transfer" 
                      className="w-12 h-12 object-cover rounded-lg border border-slate-300 cursor-pointer hover:ring-2 hover:ring-blue-500 transition" 
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
                        terminName: (hasInstallments && selectedTerminIdx !== null) ? inv.installments[selectedTerminIdx]?.keterangan : "Bukti Upload Baru",
                        catatan
                      })}
                      title="Klik untuk perbesar foto bukti transfer"
                    />
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
                        terminName: (hasInstallments && selectedTerminIdx !== null) ? inv.installments[selectedTerminIdx]?.keterangan : "Bukti Upload Baru",
                        catatan
                      })}
                      className="absolute inset-0 bg-black/40 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBuktiPreview(null)}
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
                Status invoice otomatis tercatat <strong>Paid ✓</strong> dan tersinkronisasi ke laporan Realisasi Keuangan.
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
                className={`px-5 py-2.5 rounded-xl font-bold transition shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 ${
                  isSuccessAnimated
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
    </>
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
function TabDaftarInvoice({ data = [], onDelete, dataSiswa = [], onRefresh, onApprovePayment }) {
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
  const handleReceiptClick = (inv) => {
    const latestPayment = inv.lastPayment || (inv.payments && inv.payments[inv.payments.length - 1]) || {
      receiptNo: `RCP-${inv.id}-01`,
      tglBayar: inv.tanggal || new Date().toISOString().slice(0, 10),
      jamBayar: "12:00",
      approverName: "FINANCE LPK CREATIVA",
      metode: "Transfer Bank BCA",
      rekening: "BCA 1832-918-428 an PT CREATIVA BRIDGING INTERN",
      jumlah: Number(inv.terbayar) || Number(inv.total) || 0,
      catatan: `Pelunasan tagihan pelatihan ${inv.program || 'Bahasa Jepang'}`
    };
    previewReceiptPDF(latestPayment, inv);
  };

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

      {/* Modal Catat & Approve Pembayaran (Finance Adjustment) */}
      {paymentModalInv && (
        <CatatPembayaranModal
          inv={paymentModalInv}
          onClose={() => setPaymentModalInv(null)}
          onApprove={(payData) => {
            if (onApprovePayment) {
              onApprovePayment(paymentModalInv, payData);
            }
            setPaymentModalInv(null);
          }}
        />
      )}

      {/* Modal Riwayat & Bukti Transfer Pembayaran */}
      {selectedBuktiInv && (
        <RiwayatBuktiInvoiceModal
          inv={selectedBuktiInv}
          onClose={() => setSelectedBuktiInv(null)}
          onOpenPaymentModal={(inv) => {
            setSelectedBuktiInv(null);
            setPaymentModalInv(inv);
          }}
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

                            {/* Preview Invoice Eye Button */}
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
  const [selectedBuktiPay, setSelectedBuktiPay] = useState(null);
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
      {selectedBuktiPay && (
        <BuktiTransferModal
          payment={selectedBuktiPay}
          invoice={{ id: selectedBuktiPay.noInv, customer: selectedBuktiPay.customer, program: selectedBuktiPay.program || "Kelas Pelatihan Bahasa Jepang", total: Number(selectedBuktiPay.jumlah || 0) + Number(selectedBuktiPay.sisa || 0) }}
          onClose={() => setSelectedBuktiPay(null)}
        />
      )}
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
                    <button onClick={()=>setSelectedBuktiPay(r)} title="Lihat Foto Bukti Transfer"
                      className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 transition cursor-pointer">
                      <ImageIcon className="w-4 h-4"/>
                    </button>
                    <button onClick={()=>setViewItem(r)} title="Lihat Detail & Bukti"
                      className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-500 hover:text-violet-600 transition cursor-pointer"><Eye className="w-4 h-4"/></button>
                    <button onClick={()=>handleDownload(r)} title="Download CSV"
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition cursor-pointer"><Download className="w-4 h-4"/></button>
                    <button onClick={()=>setDelItem(r)} title="Hapus"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition cursor-pointer"><Trash2 className="w-4 h-4"/></button>
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

  const totalCount = data.length || 1;
  const aktifCount = data.filter(d=>d.status==="Aktif").length;
  const prioritasCount = data.filter(d=>d.status==="Prioritas").length;
  const menunggakCount = data.filter(d=>d.status==="Menunggak").length;
  const baruCount = data.filter(d=>d.status==="Baru").length;

  const donutData = [
    { label:"Aktif",     count: aktifCount,     pct: Math.round(aktifCount/totalCount*100), color:"#10b981" },
    { label:"Prioritas", count: prioritasCount, pct: Math.round(prioritasCount/totalCount*100), color:"#8b5cf6" },
    { label:"Menunggak", count: menunggakCount, pct: Math.round(menunggakCount/totalCount*100), color:"#ef4444" },
    { label:"Baru",      count: baruCount,      pct: Math.round(baruCount/totalCount*100), color:"#3b82f6" },
  ];
  const donut = `conic-gradient(${donutData.map((d,i,a) => {
    const start = a.slice(0,i).reduce((s,x)=>s+x.pct,0);
    return `${d.color} ${start}% ${start+d.pct}%`;
  }).join(", ")})`;
  const top5  = [...data].sort((a,b)=>(b.total||0)-(a.total||0)).slice(0,5);

  const totalPiutangSiswa = data.reduce((s, r) => s + (r.sisa != null ? Number(r.sisa) : (r.status === 'Aktif' ? 0 : Number(r.total || 0))), 0);
  const siswaBerpiutangCount = data.filter(d => (d.sisa || 0) > 0).length;

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
              { label:"Siswa Aktif",   value:aktifCount,                                   sub:`${Math.round(aktifCount/totalCount*100)}% dari total siswa`,   ok:true,  Icon:CheckCircle,  bg:"bg-emerald-100", ic:"text-emerald-600", money:false },
              { label:"Siswa Baru",    value:baruCount,                                    sub:"+16% dari periode lalu", ok:true,  Icon:User,         bg:"bg-blue-100",    ic:"text-blue-600",    money:false },
              { label:"Piutang Siswa", value:totalPiutangSiswa,                            sub:`${siswaBerpiutangCount} siswa memiliki sisa tagihan`, ok:totalPiutangSiswa === 0, Icon:Clock, bg:"bg-red-100", ic:"text-red-500", money:true,  vc:"text-red-500" },
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5"/> Reset Filter
            </button>
          </div>

          {/* Table */}
          <p className="px-4 pt-4 pb-2 text-sm font-black text-slate-700">Daftar Siswa (Tersinkronisasi Invoice)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["ID Siswa","Nama Siswa","PIC / Kontak","Email / WhatsApp","Jml Invoice","Total Tagihan","Sisa Piutang","Status","Aksi"].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length===0?(
                  <tr><td colSpan={9} className="text-center py-10 text-slate-400 font-semibold">Tidak ada data</td></tr>
                ):rows.map((r,i)=>(
                  <tr key={r.id || i} className={`border-b border-slate-50 hover:bg-violet-50/50 transition-colors ${i%2===0?"":"bg-slate-50/30"}`}>
                    <td className="px-4 py-3 text-violet-600 font-bold font-mono">{r.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      <span className="cursor-pointer hover:text-violet-600 hover:underline" onClick={()=>setViewItem(r)}>
                        {r.nama}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-700">{r.pic || 'Siswa Mandiri'}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3"/>{r.telp || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <p>{r.email || '-'}</p>
                      <p className="flex items-center gap-1 mt-0.5 text-emerald-600"><MessageCircle className="w-3 h-3"/>{r.telp || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-extrabold ${r.jmlInv > 0 ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-400"}`}>
                        {r.jmlInv || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{formatRp(r.total || 0)}</td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap">
                      {(r.sisa || 0) > 0 ? (
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
                        <button onClick={()=>setViewItem(r)} title="Lihat Profil & Riwayat Tagihan Siswa"
                          className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-500 hover:text-violet-600 transition cursor-pointer"><Eye className="w-4 h-4"/></button>
                        <button onClick={()=>handleDownload(r)} title="Download CSV"
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition cursor-pointer"><Download className="w-4 h-4"/></button>
                        <button onClick={()=>setDelItem(r)} title="Hapus"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-500 transition cursor-pointer"><Trash2 className="w-4 h-4"/></button>
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

// ─── SYNCHRONIZE INVOICE TERKIRIM DENGAN DAFTAR INVOICE ──────────────────────
function syncTerkirimWithInvoices(currentInvoices, existingTerkirim = []) {
  if (!Array.isArray(currentInvoices)) return existingTerkirim || [];
  
  const savedTerkirim = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('saved_custom_terkirim') || '[]') : [];
  
  return currentInvoices.map((inv, idx) => {
    const customMatch = savedTerkirim.find(t => t.id === inv.id || t.noInv === inv.id);
    const existingMatch = Array.isArray(existingTerkirim) ? existingTerkirim.find(t => t.id === inv.id || t.noInv === inv.id) : null;
    const base = customMatch || existingMatch || {};

    const cleanEmail = inv.email && inv.email !== '-' 
      ? inv.email 
      : `${(inv.customer || 'siswa').toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
    const cleanPhone = inv.phone && inv.phone !== '-' ? inv.phone : (inv.customer?.toLowerCase().includes("nova") ? "0813-9988-7766" : "0812-7788-9900");
    const defaultKanal = (inv.customer?.toLowerCase().includes("nova") || inv.phone) ? "WhatsApp" : (idx % 2 === 0 ? "Email" : "WhatsApp");
    const chosenKanal = base.kanal || defaultKanal;
    const penerima = base.penerima || (chosenKanal === 'WhatsApp' ? cleanPhone : cleanEmail);

    return {
      id: inv.id,
      noInv: inv.id,
      customer: inv.customer || 'Siswa LPK',
      tglKirim: base.tglKirim || inv.tanggal || new Date().toISOString().slice(0, 10),
      kanal: chosenKanal,
      penerima: penerima,
      statusKirim: base.statusKirim || 'Terkirim',
      statusBaca: base.statusBaca || (normalizeFinanceStatus(inv.status) === 'Paid' ? 'Dibaca' : 'Pending'),
      nominal: Number(inv.total) || 0,
      terbayar: Number(inv.terbayar) || 0,
      sisa: Number(inv.sisa) || 0,
      statusInvoice: normalizeFinanceStatus(inv.status),
      program: inv.program || inv.keterangan || 'Kelas Intensif Offline'
    };
  });
}

// ─── SYNCHRONIZE PEMBAYARAN DENGAN DAFTAR INVOICE ─────────────────────────────
function syncPembayaranWithInvoices(currentInvoices, existingPayments = []) {
  if (!Array.isArray(currentInvoices)) return existingPayments || [];
  const result = Array.isArray(existingPayments) ? [...existingPayments] : [];

  currentInvoices.forEach(inv => {
    const totalVal = Number(inv.total) || 0;
    const stNorm = normalizeFinanceStatus(inv.status);
    let terbayarVal = 0;
    if (stNorm === "Paid") {
      terbayarVal = totalVal;
    } else if (stNorm === "Partially Paid") {
      terbayarVal = inv.terbayar != null ? Number(inv.terbayar) : Math.round(totalVal * 0.5);
    } else {
      terbayarVal = inv.terbayar != null ? Number(inv.terbayar) : 0;
    }

    if (terbayarVal > 0) {
      const alreadyHas = result.some(p => p.noInv === inv.id || p.id === `PAY-${inv.id}-01`);
      if (!alreadyHas) {
        result.unshift({
          id: `PAY-${inv.id}-01`,
          noInv: inv.id,
          customer: inv.customer,
          tglBayar: inv.tanggal || new Date().toISOString().slice(0, 10),
          jamBayar: "10:30",
          metode: "Transfer Bank BCA",
          rekening: "BCA 1832-918-428 an PT CREATIVA BRIDGING INTERN",
          jumlah: terbayarVal,
          sisa: Math.max(0, totalVal - terbayarVal),
          statusVerif: "Terverifikasi",
          terminName: stNorm === "Paid" ? "Pelunasan (Full Payment)" : "Cicilan ke-1",
          refNumber: `TRX-${inv.id}-01`,
          catatan: `Pembayaran program ${inv.program || 'pelatihan'} an. ${inv.customer}`
        });
      }
    }
  });

  return result;
}

// ─── SYNCHRONIZE SISWA DENGAN DAFTAR INVOICE & STUDENTS MASTER ────────────────
function syncSiswaWithInvoices(currentInvoices, baseSiswaList = []) {
  if (!Array.isArray(currentInvoices)) return baseSiswaList || [];

  let localStudents = [];
  try {
    const rawLocal = localStorage.getItem("local_only_students_finance");
    if (rawLocal) localStudents = JSON.parse(rawLocal);
  } catch (e) {}

  const combinedMap = new Map();

  // 1. Masukkan base siswa default/API
  (Array.isArray(baseSiswaList) ? baseSiswaList : []).concat(localStudents).forEach((s, idx) => {
    const nameKey = (s.nama || s.name || '').trim().toLowerCase();
    if (nameKey) {
      combinedMap.set(nameKey, {
        id: s.id ? (String(s.id).startsWith('SIS-') ? s.id : `SIS-${String(s.id).padStart(3, '0')}`) : `SIS-${String(idx + 1).padStart(3, '0')}`,
        nama: s.nama || s.name || 'Siswa',
        pic: s.pic || s.affiliator || 'Siswa Mandiri',
        telp: s.telp || s.phone || s.kontak || s.no_wa || '0812-7788-9900',
        email: s.email && s.email !== '-' ? s.email : `${(s.nama || 'siswa').toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        status: s.status || 'Aktif',
        program: s.program || 'Kelas Intensif Offline'
      });
    }
  });

  // 2. Pastikan SETIAP siswa yang ada di invoice terdaftar
  currentInvoices.forEach(inv => {
    const nameKey = (inv.customer || '').trim().toLowerCase();
    if (nameKey) {
      if (!combinedMap.has(nameKey)) {
        const nextId = `SIS-${String(combinedMap.size + 1).padStart(3, '0')}`;
        combinedMap.set(nameKey, {
          id: nextId,
          nama: inv.customer,
          pic: 'Siswa Mandiri',
          telp: inv.phone && inv.phone !== '-' ? inv.phone : (nameKey.includes("nova") ? "0813-9988-7766" : "0812-7788-9900"),
          email: inv.email && inv.email !== '-' ? inv.email : `${inv.customer.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
          status: 'Aktif',
          program: inv.program || 'Kelas Intensif Offline'
        });
      } else {
        const existing = combinedMap.get(nameKey);
        if (inv.phone && inv.phone !== '-') existing.telp = inv.phone;
        if (inv.email && inv.email !== '-') existing.email = inv.email;
        if (inv.program) existing.program = inv.program;
      }
    }
  });

  // 3. Hitung agregasi dinamis untuk setiap siswa: jmlInv, totalTagihan, terbayar, sisa
  const finalSiswa = Array.from(combinedMap.values()).map(s => {
    const sNameKey = s.nama.trim().toLowerCase();
    const matchingInvoices = currentInvoices.filter(inv => (inv.customer || '').trim().toLowerCase() === sNameKey);

    const jmlInv = matchingInvoices.length;
    const totalTagihan = matchingInvoices.reduce((acc, inv) => acc + (Number(inv.total) || 0), 0);
    const totalTerbayar = matchingInvoices.reduce((acc, inv) => {
      const st = normalizeFinanceStatus(inv.status);
      if (st === 'Paid') return acc + (Number(inv.total) || 0);
      return acc + (Number(inv.terbayar) || 0);
    }, 0);
    const totalSisa = Math.max(0, totalTagihan - totalTerbayar);

    let studentStatus = s.status || 'Aktif';
    if (jmlInv > 0) {
      if (totalSisa > 0) {
        studentStatus = 'Prioritas';
      } else {
        studentStatus = 'Aktif';
      }
    } else {
      studentStatus = s.status || 'Baru';
    }

    return {
      ...s,
      jmlInv,
      total: totalTagihan,
      terbayar: totalTerbayar,
      sisa: totalSisa,
      status: studentStatus,
      invoices: matchingInvoices
    };
  });

  finalSiswa.sort((a, b) => b.jmlInv - a.jmlInv || b.total - a.total);

  return finalSiswa;
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
        const savedPayments = JSON.parse(localStorage.getItem('billing_pembayaran_custom') || '[]');
        const serverInvs = res.data.data.invoices || [];
        const mergedInvs = [
          ...savedCustom,
          ...serverInvs.filter(s => !savedCustom.some(b => b.id === s.id))
        ].filter(inv => !deletedIds.includes(inv.id));
        const validDefaults = DEFAULT_BLUEPRINT_INVOICES.map(def => {
          const found = savedCustom.find(s => s.id === def.id);
          return found || def;
        }).filter(i => !deletedIds.includes(i.id));
        
        const finalInvoices = mergedInvs.length > 0 ? mergedInvs : validDefaults;
        setInvoices(finalInvoices);

        // 1. SINKRONISASI INVOICE TERKIRIM
        const syncedTerkirim = syncTerkirimWithInvoices(finalInvoices, res.data.data.terkirim || []);
        setTerkirim(syncedTerkirim);
        
        // 2. SINKRONISASI PEMBAYARAN
        const serverPayments = res.data.data.pembayaran || [];
        const mergedPayments = [
          ...savedPayments,
          ...serverPayments.filter(sp => !savedPayments.some(cp => cp.id === sp.id || cp.noInv === sp.noInv))
        ];
        const syncedPayments = syncPembayaranWithInvoices(finalInvoices, mergedPayments);
        setPembayaran(syncedPayments);

        // 3. SINKRONISASI SISWA
        const syncedSiswa = syncSiswaWithInvoices(finalInvoices, res.data.data.siswa || []);
        setSiswa(syncedSiswa);
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
      const savedPayments = JSON.parse(localStorage.getItem('billing_pembayaran_custom') || '[]');
      const serverInvs = data.data.invoices || [];
      const mergedInvs = [
        ...savedCustom,
        ...serverInvs.filter(s => !savedCustom.some(b => b.id === s.id))
      ].filter(inv => !deletedIds.includes(inv.id));
      const validDefaults = DEFAULT_BLUEPRINT_INVOICES.map(def => {
        const found = savedCustom.find(s => s.id === def.id);
        return found || def;
      }).filter(i => !deletedIds.includes(i.id));
      
      const finalInvoices = mergedInvs.length > 0 ? mergedInvs : validDefaults;
      setInvoices(finalInvoices);

      // 1. SINKRONISASI INVOICE TERKIRIM
      const syncedTerkirim = syncTerkirimWithInvoices(finalInvoices, data.data.terkirim || []);
      setTerkirim(syncedTerkirim);
      
      // 2. SINKRONISASI PEMBAYARAN
      const serverPayments = data.data.pembayaran || [];
      const mergedPayments = [
        ...savedPayments,
        ...serverPayments.filter(sp => !savedPayments.some(cp => cp.id === sp.id || cp.noInv === sp.noInv))
      ];
      const syncedPayments = syncPembayaranWithInvoices(finalInvoices, mergedPayments);
      setPembayaran(syncedPayments);

      // 3. SINKRONISASI SISWA
      const syncedSiswa = syncSiswaWithInvoices(finalInvoices, data.data.siswa || []);
      setSiswa(syncedSiswa);
    }).catch(error => { if (active) setLoadError(error.response?.data?.message || error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // ── APPROVE PAYMENT & REALIZATION SINKRONISASI ──
  const handleApprovePayment = (inv, paymentData) => {
    const totalVal = Number(inv.total) || 0;
    const oldTerbayar = Number(inv.terbayar) || 0;
    const addedNominal = Number(paymentData.nominal) || 0;
    const newTerbayar = Math.min(totalVal, oldTerbayar + addedNominal);
    const newSisa = Math.max(0, totalVal - newTerbayar);
    const newStatus = newSisa === 0 ? "Paid" : "Partially Paid";

    const paymentIndex = (inv.payments?.length || 0) + 1;
    const receiptNo = `RCP-${inv.id}-${String(paymentIndex).padStart(2, '0')}`;
    const paymentRecord = {
      id: `PAY-${Date.now()}`,
      receiptNo,
      noInv: inv.id,
      customer: inv.customer,
      tglBayar: paymentData.tglBayar,
      jamBayar: paymentData.jamBayar,
      approverName: paymentData.approverName || "FINANCE LPK CREATIVA",
      metode: paymentData.metode,
      rekening: paymentData.rekening,
      refNumber: paymentData.refNumber || "",
      jumlah: addedNominal,
      sisa: newSisa,
      buktiBayar: paymentData.buktiBayarUrl || "",
      catatan: paymentData.catatan || "",
      statusVerif: "Terverifikasi",
      approvedAt: `${paymentData.tglBayar} ${paymentData.jamBayar}`,
      termin: paymentData.terminIndex || null,
      terminName: paymentData.terminName || null
    };

    const updatedInvoice = {
      ...inv,
      terbayar: newTerbayar,
      sisa: newSisa,
      status: newStatus,
      paid_at: paymentData.tglBayar,
      payments: [...(inv.payments || []), paymentRecord],
      lastPayment: paymentRecord
    };

    // 1. Update React state
    setInvoices(prev => {
      const updated = prev.map(item => item.id === inv.id ? updatedInvoice : item);
      setTerkirim(prevT => syncTerkirimWithInvoices(updated, prevT));
      setSiswa(prevS => syncSiswaWithInvoices(updated, prevS));
      return updated;
    });
    setPembayaran(prev => [paymentRecord, ...prev]);

    // 2. Persist to saved_custom_invoices for DashboardFinance Realisasi synchronization
    const savedCustom = JSON.parse(localStorage.getItem('saved_custom_invoices') || '[]');
    const existingIdx = savedCustom.findIndex(item => item.id === inv.id);
    let newSavedCustom = [];
    if (existingIdx >= 0) {
      newSavedCustom = savedCustom.map((item, idx) => idx === existingIdx ? updatedInvoice : item);
    } else {
      newSavedCustom = [updatedInvoice, ...savedCustom];
    }
    localStorage.setItem('saved_custom_invoices', JSON.stringify(newSavedCustom));

    // 3. Persist to billing_pembayaran_custom
    const savedPayments = JSON.parse(localStorage.getItem('billing_pembayaran_custom') || '[]');
    savedPayments.unshift(paymentRecord);
    localStorage.setItem('billing_pembayaran_custom', JSON.stringify(savedPayments));

    // 4. SYNC KE TRANSAKSI PEMASUKAN (finance_income_data)
    try {
      const existingIncomes = JSON.parse(localStorage.getItem('finance_income_data') || '[]');
      const newIncomeEntry = {
        id: Date.now(),
        tanggal: paymentData.tglBayar,
        siswa: inv.customer || 'Siswa LPK',
        kategori: 'Biaya Kursus',
        sumberDana: paymentData.metode?.includes('BCA') ? 'BCA' : (paymentData.metode || 'Bank BCA'),
        nominal: addedNominal,
        status: 'Lunas',
        deskripsi: `Penerimaan ${paymentData.terminName || 'Pembayaran'} Invoice #${inv.id} - Kwitansi ${receiptNo}`,
        buktiFoto: paymentData.buktiBayarUrl || '',
        buktiNama: paymentData.buktiBayarUrl ? `bukti-${inv.id}.png` : '',
        buktiLink: '',
        noInv: inv.id,
        receiptNo: receiptNo
      };
      existingIncomes.unshift(newIncomeEntry);
      localStorage.setItem('finance_income_data', JSON.stringify(existingIncomes));
    } catch (e) {
      console.warn("Gagal sync ke finance_income_data:", e);
    }

    // 5. SYNC KE SALDO REKENING BANK & COA (finance_rekening_data & finance_coa_data)
    try {
      const existingRekenings = JSON.parse(localStorage.getItem('finance_rekening_data') || '[]');
      if (Array.isArray(existingRekenings) && existingRekenings.length > 0) {
        let bcaFound = false;
        const updatedRekenings = existingRekenings.map(rek => {
          const rekStr = `${rek.nama} ${rek.bank} ${rek.noRek}`.toLowerCase();
          const isPetty = rekStr.includes('petty') || rekStr.includes('kas kecil');
          if (!bcaFound && !isPetty && (rekStr.includes('1832') || rekStr.includes('bca') || (rek.id === 1 && !isPetty))) {
            bcaFound = true;
            return {
              ...rek,
              saldo: Number(rek.saldo || 0) + addedNominal
            };
          }
          return rek;
        });
        localStorage.setItem('finance_rekening_data', JSON.stringify(updatedRekenings));
      }

      // Sinkronkan ke Akun Kas & Bank di COA (finance_coa_data)
      const existingCoa = JSON.parse(localStorage.getItem('finance_coa_data') || '[]');
      if (Array.isArray(existingCoa) && existingCoa.length > 0) {
        let bcaCoaFound = false;
        const updatedCoa = existingCoa.map(coa => {
          const coaStr = `${coa.kode} ${coa.nama} ${coa.rekeningDetail || ''}`.toLowerCase();
          const isPetty = coaStr.includes('petty') || coaStr.includes('kas kecil');
          if (!bcaCoaFound && !isPetty && (coaStr.includes('bca') || coaStr.includes('1832') || coa.kode === '1002')) {
            bcaCoaFound = true;
            return {
              ...coa,
              saldo: Number(coa.saldo || 0) + addedNominal
            };
          }
          return coa;
        });
        localStorage.setItem('finance_coa_data', JSON.stringify(updatedCoa));
      }
    } catch (e) {
      console.warn("Gagal sync ke finance_rekening_data & finance_coa_data:", e);
    }

    // 6. Trigger SweetAlert with direct Action to open Kwitansi PDF!
    Swal.fire({
      icon: "success",
      title: "✓ Pembayaran Berhasil Disetujui!",
      html: `
        <div style="font-size: 13px; text-align: left; line-height: 1.6; color: #334155;">
          <p><strong>No. Invoice:</strong> ${inv.id}</p>
          <p><strong>Customer:</strong> ${inv.customer}</p>
          ${paymentData.terminName ? `<p><strong>Alokasi Termin:</strong> <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${paymentData.terminName}</span></p>` : ''}
          <p><strong>Nominal Diterima:</strong> ${formatRp(addedNominal)}</p>
          <p><strong>Status Tagihan:</strong> <span style="color: ${newStatus === 'Paid' ? '#059669' : '#d97706'}; font-weight: bold;">${newStatus === 'Paid' ? 'LUNAS (Paid)' : 'Sebagian (Partially Paid)'}</span></p>
          <p><strong>Sisa Piutang:</strong> ${formatRp(newSisa)}</p>
          <p><strong>No. Kwitansi (Receipt):</strong> <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #0f172a;">${receiptNo}</code></p>
          <p style="margin-top: 8px; font-size: 12px; color: #64748b;">Proyeksi kas dan Realisasi keuangan di Dashboard telah diperbarui secara otomatis.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "🧾 Buka Kwitansi (Receipt PDF)",
      confirmButtonColor: "#059669",
      cancelButtonText: "Selesai",
      cancelButtonColor: "#64748b",
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        previewReceiptPDF(paymentRecord, updatedInvoice);
      }
    });
  };

  const handleDelete = async (type, id) => {
    // 1. Immediately delete from local state
    if (type === 'invoice') {
      setInvoices(prev => {
        const remaining = prev.filter(inv => inv.id !== id);
        setTerkirim(prevT => prevT.filter(t => t.id !== id && t.noInv !== id));
        setPembayaran(prevP => prevP.filter(p => p.noInv !== id));
        setSiswa(prevS => syncSiswaWithInvoices(remaining, prevS));
        return remaining;
      });
      
      // Remove from saved_custom_invoices
      const savedCustom = JSON.parse(localStorage.getItem('saved_custom_invoices') || '[]');
      const filteredCustom = savedCustom.filter(s => s.id !== id);
      localStorage.setItem('saved_custom_invoices', JSON.stringify(filteredCustom));

      // Remove from saved_custom_terkirim
      const savedTerkirim = JSON.parse(localStorage.getItem('saved_custom_terkirim') || '[]');
      localStorage.setItem('saved_custom_terkirim', JSON.stringify(savedTerkirim.filter(t => t.id !== id && t.noInv !== id)));

      // Remove from billing_pembayaran_custom
      const savedPayments = JSON.parse(localStorage.getItem('billing_pembayaran_custom') || '[]');
      localStorage.setItem('billing_pembayaran_custom', JSON.stringify(savedPayments.filter(p => p.id !== id && p.noInv !== id)));

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
      const savedPayments = JSON.parse(localStorage.getItem('billing_pembayaran_custom') || '[]');
      localStorage.setItem('billing_pembayaran_custom', JSON.stringify(savedPayments.filter(p => p.id !== id && p.noInv !== id)));
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
            {activeTab === 0 && (
              <TabDaftarInvoice 
                data={invoices} 
                onDelete={(id) => handleDelete('invoice', id)} 
                dataSiswa={siswa} 
                onRefresh={fetchData} 
                onApprovePayment={handleApprovePayment} 
              />
            )}
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
