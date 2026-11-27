<?php
/**
 * invoice_generator.php
 * Generate PDF Invoice (Full Payment / Cicilan) — Template resmi Creativa Bridging International
 * Berdasarkan template: Invoice Fitri_Dana Talang.docx
 * 
 * POST body (JSON):
 * {
 *   "siswa_id": 1,
 *   "nama_siswa": "Fitriani Laelaturrobikha",
 *   "nomor_wa": "0813-2530-0223",
 *   "email": "siswa@gmail.com",
 *   "program": "Matching Job",
 *   "batch": "Batch 2 Cianjur",
 *   "tipe_pembayaran": "fullpayment",   // atau "cicilan"
 *   "items": [                           // item-item biaya
 *     {"nama": "Biaya Program Matching Job", "qty": 1, "harga": 37000000},
 *     {"nama": "Biaya Fasilitas Pembiayaan / Dana Talang Bank", "qty": 1, "harga": 17760000}
 *   ],
 *   "biaya_tambahan": [                  // opsional
 *     {"nama": "Pendidikan Bahasa Jepang", "qty": 1, "harga": 2000000},
 *     {"nama": "Transport LPK", "qty": 1, "harga": 280000}
 *   ],
 *   "biaya_termasuk": [                  // list item yg termasuk
 *     "Bantuan Administrasi & Pengurusan Dokumen (Rirekisho, Kyuujinhyo, Kontrak Kerja, EKTLN, BPJS Ketenagakerjaan, CoE & Visa)",
 *     "Biaya P3MI (kondisional)",
 *     "Biaya BPJS Ketenagakerjaan & Visa",
 *     "Tiket one way (jakarta-jepang)"
 *   ],
 *   "biaya_tidak_termasuk": [
 *     "MCU awal *S&K Berlaku",
 *     "Paspor *S&K Berlaku"
 *   ],
 *   "cicilan": [
 *     {"ke": 1, "tanggal": "2026-09-01", "nominal": 3765000},
 *     ...
 *   ],
 *   "tanggal_invoice": "2026-08-28",
 *   "include_syarat": true
 * }
 */

require_once 'config.php';
require_once 'database.php';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtRp($n) {
    return 'Rp' . number_format((float)$n, 0, ',', '.') . ',00';
}
function fmtRpShort($n) {
    return number_format((float)$n, 0, ',', '.');
}
function fmtDate($d) {
    if (!$d) return '-';
    $months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agust','Sep','Okt','Nov','Des'];
    $ts = strtotime($d);
    return date('d', $ts) . ' ' . $months[date('n', $ts) - 1] . ' ' . date('Y', $ts);
}

function generateNomorInvoice($pdo) {
    $year  = date('Y');
    $year2 = date('y'); // 2 digit year
    $month = date('m');
    $stmt  = $pdo->prepare("SELECT COUNT(*) FROM invoices WHERE YEAR(created_at)=? AND MONTH(created_at)=?");
    $stmt->execute([$year, $month]);
    $seq = (int)$stmt->fetchColumn() + 1;
    
    // Format: TGCJ + 2-digit year + 2-digit month + 3-digit urutan
    return "TGCJ{$year2}{$month}" . str_pad($seq, 3, '0', STR_PAD_LEFT);
}


// ─── Ultra Robust Logo Helper ─────────────────────────────────────────────────
function svgLogo() { return '<img src="data:image/png;base64,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" alt="Creativa Bridging Internasional" style="max-height:75px; width:auto; object-fit:contain;">'; }


// ─── Generate HTML Invoice (template persis Creativa Bridging) ─────────────────
function generateInvoiceHTML($d) {
    $tipe        = strtolower($d['tipe_pembayaran'] ?? 'fullpayment');
    $isCicilan   = in_array($tipe, ['cicilan', 'dp']);
    $items       = $d['items'] ?? [
        ['nama' => 'Biaya Program ' . ($d['program'] ?? 'Intensif'), 'qty' => 1, 'harga' => $d['total_biaya'] ?? 0]
    ];
    $biayaTambahan    = $d['biaya_tambahan'] ?? [];
    $biayaTermasuk    = $d['biaya_termasuk'] ?? [
        'Kelas Bahasa Jepang Level N5 & N4',
        'Kelas Persiapan Ujian JFT & SSW',
        'Biaya Ujian JFT A2.2 & SSW (masing-masing tercover 1x)',
        'Buku & Materi Pelajaran',
        'Panel & Moodle (Learning Online System for Student)',
        'Seragam, ID Card & Suripa',
        'Sertifikat Kompetensi LPK',
        'Fasilitas Kelas & Asrama selama 7 bulan',
        'Praktek & Kegiatan LPK (FMD, Kunjungan Matsuri, Bukber, Acara Kelulusan, dll) *kondisional',
        'Konsultasi Pendidikan/Pelatihan & Peluang Karir di Jepang (kapan pun selama Pelatihan)'
    ];
    $biayaTidakTermasuk = $d['biaya_tidak_termasuk'] ?? [
        'Biaya Utilitas (Air, Listrik, Internet, & IPL Asrama per Bulan)',
        'Biaya Makan',
        'Keperluan Pribadi Lainnya'
    ];

    // Hitung total
    $subtotal = 0;
    foreach ($items as $item) $subtotal += (float)($item['harga'] ?? 0) * (int)($item['qty'] ?? 1);
    foreach ($biayaTambahan as $item) $subtotal += (float)($item['harga'] ?? 0) * (int)($item['qty'] ?? 1);

    $cicilan = $d['cicilan'] ?? [];

    // ─── CSS ──────────────────────────────────────────────────────────────────
    $css = '
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #222; background: white; }
      .page { width: 210mm; min-height: 297mm; padding: 14mm 16mm 14mm 16mm; }
      
      /* HEADER */
      .header { display: flex; justify-content: space-between; align-items: flex-start; 
                border-bottom: 3px solid #0d1e4c; padding-bottom: 10px; margin-bottom: 14px; }
      .logo-area { display: flex; align-items: center; gap: 10px; }
      .logo-img { max-width: 250px; height: auto; object-fit: contain; }
      .company-info p { margin: 1px 0; }
      .company-name { font-size: 11pt; font-weight: bold; color: #222; }
      .company-detail { font-size: 8.5pt; color: #222; margin: 1px 0; }
      .invoice-title-block { text-align: right; }
      .invoice-word { font-size: 28pt; font-weight: bold; color: #0d1e4c; letter-spacing: 1px; line-height: 1.2; margin-bottom: 8px; }
      .invoice-word-sub { font-size: 8pt; color: #555; margin-top: 2px; }
      
      /* TO & DETAILS */
      .to-details { display: flex; justify-content: space-between; margin-bottom: 14px; }
      .to-block { flex: 1; }
      .to-label { font-size: 9pt; color: #555; margin-bottom: 6px; }
      .to-name { font-size: 11pt; font-weight: bold; color: #000; margin-bottom: 8px; text-transform: uppercase; }
      .to-info { font-size: 9pt; color: #777; }
      .detail-block { width: 300px; text-align:right; }
      .detail-table { width: 100%; border-collapse: collapse; }
      .detail-table td { padding: 2px 0; font-size: 9pt; vertical-align: top; text-align: right; }
      .detail-label { color: #000; font-weight: bold; width: 130px; text-align: right; padding-right: 10px; }
      .detail-value { color: #222; text-align: right; }
      
      /* ITEMS TABLE */
      .section-title { font-size: 8.5pt; font-weight: bold; color: #1a237e; margin: 12px 0 6px; 
                        text-transform: uppercase; letter-spacing: 0.5px; }
      .items-table { width: 100%; border-collapse: collapse; }
      .items-table th { background: #1a237e; color: white; padding: 7px 9px; font-size: 8pt;
                         text-align: left; font-weight: bold; }
      .items-table th.right { text-align: right; }
      .items-table th.center { text-align: center; }
      .items-table td { padding: 6px 9px; font-size: 8.5pt; border-bottom: 1px solid #eee; vertical-align: top; }
      .items-table td.right { text-align: right; }
      .items-table td.center { text-align: center; }
      .items-table tr:hover td { background: #f8f9ff; }
      .section-row td { background: #e8eaf6; font-weight: bold; color: #1a237e; font-size: 8pt;
                         padding: 5px 9px; }
      .include-list { margin: 4px 0 0 12px; color: #555; font-size: 8pt; }
      .include-list li { margin-bottom: 2px; }
      
      /* TOTALS */
      .totals-area { display: flex; justify-content: flex-end; margin-top: 12px; }
      .totals-table { width: 300px; border-collapse: collapse; }
      .totals-table td { padding: 8px 10px; font-size: 11pt; color: #000; }
      .totals-table .total-label { font-weight: bold; text-align: right; width: 140px; }
      .totals-table .total-value { text-align: right; }
      .totals-table tr:first-child td { border-top: 1px solid #000; }
      .totals-table tr:nth-child(2) td { border-top: 1px solid #000; }
      .totals-table tr:nth-child(3) td { border-top: 1px solid #000; padding-bottom: 20px; }
      
      /* DIVIDER */
      .page-break { page-break-after: always; }
      hr.divider { border: none; border-top: 1px dashed #ccc; margin: 12px 0; }
      
      /* CICILAN TABLE */
      .cicilan-table { width: 100%; border-collapse: collapse; border: 1px solid #ccc; margin-top: 10px; }
      .cicilan-table th { background: #fff; color: #000; padding: 8px 10px; font-size: 11pt; text-align: left; font-weight: bold; border: 1px solid #ccc; }
      .cicilan-table td { padding: 8px 10px; font-size: 11pt; border: 1px solid #ccc; color: #000; }
      .cicilan-table td:last-child { text-align: right; }
      .cicilan-title { font-size: 18pt; font-weight: bold; margin-bottom: 10px; color: #000; margin-top: 40px; }
      
      /* PAYMENT INFO */
      .payment-box { margin-top: 14px; border: 1px solid #c5cae9; border-radius: 6px; 
                      padding: 12px 14px; background: #f8f9ff; }
      .payment-title { font-weight: bold; color: #1a237e; font-size: 9pt; margin-bottom: 8px; }
      .payment-step { font-size: 8.5pt; color: #333; margin-bottom: 5px; }
      .payment-step b { color: #1a237e; }
      .bank-info { background: white; border: 1px solid #ddd; border-radius: 4px; 
                   padding: 8px 10px; margin: 6px 0; font-size: 8.5pt; }
      .confidential { font-size: 8pt; color: #888; font-style: italic; margin-top: 8px; }
      .thanks { font-size: 9pt; font-weight: bold; color: #1a237e; text-align: center; margin-top: 10px; }
      
      /* SIGNATURE */
      .signature-area { display: flex; justify-content: space-between; margin-top: 30px; }
      .sig-block { text-align: left; width: 45%; }
      .sig-name { font-size: 8.5pt; color: #555; margin-bottom: 60px; }
      .sig-line { border-top: 1.5px solid #333; padding-top: 6px; font-size: 8.5pt; }
      .sig-title { font-size: 7.5pt; color: #555; }
    </style>';

    // ─── Page 1: Invoice ──────────────────────────────────────────────────────
    $itemRows = '';
    foreach ($items as $item) {
        $amount = (float)($item['harga'] ?? 0) * (int)($item['qty'] ?? 1);
        $deskripsiHtml = !empty($item['deskripsi']) ? "<br/><span style='font-size:8pt;color:#444;font-weight:normal;'>" . htmlspecialchars($item['deskripsi']) . "</span>" : "";
        
        $itemRows .= "
        <tr>
          <td><b>" . htmlspecialchars($item['nama']) . "</b>{$deskripsiHtml}</td>
          <td class='center'>" . ($item['qty'] ?? 1) . "</td>
          <td class='center'>" . fmtRpShort($item['harga'] ?? 0) . "</td>
          <td class='center'><b>" . fmtRpShort($amount) . "</b></td>
        </tr>";
    }

    // Biaya Termasuk row
    $termasukList = '';
    foreach ($biayaTermasuk as $b) {
        $termasukList .= "<li>" . htmlspecialchars($b) . "</li>";
    }
    $itemRows .= "
        <tr>
          <td colspan='4'>
            <b>Biaya Sudah Termasuk:</b>
            <ul class='include-list'>{$termasukList}</ul>
          </td>
        </tr>";

    // Biaya Tidak Termasuk row
    $tidakTermasukList = '';
    foreach ($biayaTidakTermasuk as $b) {
        $tidakTermasukList .= "<li>" . htmlspecialchars($b) . "</li>";
    }
    $itemRows .= "
        <tr>
          <td colspan='4'>
            <b>Biaya Tidak Termasuk:</b>
            <ul class='include-list'>{$tidakTermasukList}</ul>
          </td>
        </tr>";

    // Biaya Tambahan section
    if (!empty($biayaTambahan)) {
        $itemRows .= "<tr class='section-row'><td colspan='4'>Biaya Tambahan Lain-nya</td></tr>";
        foreach ($biayaTambahan as $item) {
            $amount = (float)($item['harga'] ?? 0) * (int)($item['qty'] ?? 1);
            $itemRows .= "
            <tr>
              <td>" . htmlspecialchars($item['nama']) . "</td>
              <td class='center'>" . ($item['qty'] ?? 1) . "</td>
              <td class='right'>" . fmtRpShort($item['harga'] ?? 0) . "</td>
              <td class='right'>" . fmtRpShort($amount) . "</td>
            </tr>";
        }
    }

    // Page 2: Cicilan / Installment
    $page2 = '';
    $cicilanRows = '';
    if ($isCicilan && !empty($cicilan)) {
        foreach ($cicilan as $c) {
            $tgl = !empty($c['tanggal']) ? fmtDate($c['tanggal']) : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
            $label = !empty($c['deskripsi']) ? htmlspecialchars($c['deskripsi']) : ("Cicilan " . ($c['ke'] ?? ''));
            $cicilanRows .= "
            <tr>
              <td>{$label}</td>
              <td>{$tgl}</td>
              <td style='text-align:right;font-weight:bold;'>" . fmtRp($c['nominal'] ?? 0) . "</td>
            </tr>";
        }
    } else {
        // Full Payment: 1 row resmi
        $c = !empty($cicilan[0]) ? $cicilan[0] : [];
        $tgl = !empty($c['tanggal']) ? fmtDate($c['tanggal']) : fmtDate(date('Y-m-d', strtotime('+2 days')));
        $amount = !empty($c['nominal']) ? (float)$c['nominal'] : (float)($d['total_biaya'] ?? 12000000.00);
        $cicilanRows = "
        <tr>
          <td>Full Payment</td>
          <td>{$tgl}</td>
          <td style='text-align:right;font-weight:bold;'>" . fmtRp($amount) . "</td>
        </tr>";
    }

    $page2 = "
  <!-- PAGE 2: CICILAN -->
  <div class='page page-break' style='padding-top:14mm;'>
    <!-- HEADER (sama) -->
    <div class='header'>
      <div class='logo-area'>
        <div style='display:flex; align-items:center; gap: 12px;'>
          " . svgLogo() . "
        </div>
      </div>
      <div class='invoice-title-block'>
        <div class='invoice-word'>INVOICE</div>
        <p class='company-name'>PT. Creativa Bridging International</p>
        <p class='company-detail'>Ruko Bussines Park, Jalan Ir H Juanda, Panembong</p>
        <p class='company-detail'>Jawa Barat Kab Cianjur Kec Cianjur 43211, Ruko B1,</p>
        <p class='company-detail'>Mekarsari, Kec. Cianjur, Kabupaten Cianjur, Jawa Barat 43211</p>
        <p class='company-detail'>+62 815-2222-672</p>
        <p class='company-detail' style='color:#1976D2;'>https://creativabridging.com/</p>
      </div>
    </div>

    <div class='cicilan-title'>Installment</div>
    <table class='cicilan-table'>
      <thead>
        <tr>
          <th style='width:40%;'>Description</th>
          <th style='width:35%;'>Date</th>
          <th style='width:25%;text-align:right;'>Amount</th>
        </tr>
      </thead>
      <tbody>
        {$cicilanRows}
      </tbody>
    </table>

    <!-- PAYMENT INFO -->
    <div class='payment-box'>
      <div class='payment-title'>Cara Pembayaran :</div>
      <div class='payment-step'>1. Transfer via ATM/Bank</div>
      <div class='bank-info'>
        Bank <b>BCA</b> &nbsp; No. Rekening <b>1832-918-428</b> &nbsp; atas nama <b>CREATIVA BRIDGING INTERN</b>
      </div>
      <div class='payment-step'>2. Cantumkan keterangan / berita Transfer dengan memasukkan Nomor Invoice di atas</div>
      <div class='payment-step'>
        Kirim Bukti Transfer ke email <b>finance@creativabridging.com</b> &amp; kirim ke WA <b>+62 815-2222-672</b>
      </div>
      <p class='confidential'>Invoice bersifat confidential (rahasia)</p>
      <p class='thanks'>Terimakasih telah bergabung dengan LPK CREATIVA</p>
    </div>

    <!-- SIGNATURE -->
    <div class='signature-area'>
      <div class='sig-block'>
        <div class='sig-name'>Hormat kami,</div>
        <div class='sig-line'>
          <div style='font-weight:bold;font-size:9pt;'>LPK CREATIVA Team</div>
          <div style='font-size:7.5pt; color:#555;'>Finance &mdash; PT. Creativa Bridging International</div>
          <div style='font-size:7.5pt;'>https://creativabridging.com/</div>
          <div style='font-size:7.5pt;'>Telp/WA +62 815-2222-672</div>
        </div>
      </div>
      <div class='sig-block'>
        <div class='sig-name'>Diketahui Oleh,</div>
        <div class='sig-line'>
          <div style='font-weight:bold;font-size:9pt;'>Siti Nurhatifah</div>
          <div class='sig-title'>Direktur</div>
          <div class='sig-title'>PT. CREATIVA BRIDGING INTERNATIONAL</div>
        </div>
      </div>
    </div>
  </div>";

    // ─── Compose Full HTML ─────────────────────────────────────────────────────
    $html = "<!DOCTYPE html>
<html lang='id'>
<head>
<meta charset='UTF-8'>
<title>Invoice " . htmlspecialchars($d['nomor_invoice'] ?? '') . " - " . htmlspecialchars($d['nama_siswa'] ?? '') . "</title>
{$css}
</head>
<body>

<!-- PAGE 1: INVOICE DETAILS -->
<div class='page'>
  <!-- HEADER -->
  <div class='header'>
    <div class='logo-area'>
      <div style='display:flex; align-items:center; gap: 12px;'>
        " . svgLogo() . "
      </div>
    </div>
    <div class='invoice-title-block'>
      <div class='invoice-word'>INVOICE</div>
      <p class='company-name'>PT. Creativa Bridging International</p>
      <p class='company-detail'>Ruko Bussines Park, Jalan Ir H Juanda, Panembong</p>
      <p class='company-detail'>Jawa Barat Kab Cianjur Kec Cianjur 43211, Ruko B1,</p>
      <p class='company-detail'>Mekarsari, Kec. Cianjur, Kabupaten Cianjur, Jawa Barat 43211</p>
      <p class='company-detail'>+62 815-2222-672</p>
      <p class='company-detail' style='color:#1976D2;'>https://creativabridging.com/</p>
    </div>
  </div>

  <!-- TO & DETAILS -->
  <div class='to-details'>
    <div class='to-block'>
      <div class='to-label'>To,</div>
      <div class='to-name'>" . htmlspecialchars($d['nama_siswa'] ?? '') . "</div>
      <br/><br/>
      <div class='to-info'>" . htmlspecialchars($d['nomor_wa'] ?? '') . "</div>
      <div class='to-info'>" . htmlspecialchars($d['email'] ?? '') . "</div>
    </div>
    <div class='detail-block'>
      <table class='detail-table'>
        <tr>
          <td class='detail-label'>Invoice Number</td>
          <td class='detail-value'>: " . htmlspecialchars($d['nomor_invoice'] ?? '') . "</td>
        </tr>
        <tr>
          <td class='detail-label'>Invoice Date</td>
          <td class='detail-value'>: " . fmtDate($d['tanggal_invoice'] ?? date('Y-m-d')) . "</td>
        </tr>
        <tr>
          <td class='detail-label'>Payment Due</td>
          <td class='detail-value'>: " . fmtDate($d['jatuh_tempo'] ?? '') . "</td>
        </tr>
        <tr>
          <td class='detail-label'>Amount Due</td>
          <td class='detail-value'>: " . fmtRp($subtotal) . "</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- ITEMS TABLE -->
  <p class='section-title'>Detail Biaya</p>
  <table class='items-table'>
    <thead>
      <tr>
        <th style='width:52%;'>Items</th>
        <th class='center' style='width:14%;'>Quantity</th>
        <th class='center' style='width:17%;'>Price</th>
        <th class='center' style='width:17%;'>Amount</th>
      </tr>
    </thead>
    <tbody>
      {$itemRows}
    </tbody>
  </table>

  <!-- TOTALS -->
  <div class='totals-area'>
    <table class='totals-table'>
      <tr>
        <td class='total-label'>Subtotal:</td>
        <td class='total-value'>" . fmtRp($subtotal) . "</td>
      </tr>
      <tr>
        <td class='total-label'>Total:</td>
        <td class='total-value'>" . fmtRp($subtotal) . "</td>
      </tr>
      <tr class='grand'>
        <td style='font-size:11pt;'>Amount Due (IDR):</td>
        <td style='text-align:right;font-weight:bold;font-size:11pt;'>" . fmtRp($subtotal) . "</td>
      </tr>
    </table>
  </div>
  
  <div style='margin-top: 30px;'>
    <h3 style='font-size: 11pt; color: #000; margin-bottom: 8px;'>Notes/Terms</h3>
    <p style='margin-bottom: 8px;'>Kelas Mulai : September 2026</p>
    <p style='margin-bottom: 8px; line-height: 1.4;'>Biaya ujian SSW selain program SSW kaigo, pengolahan makanan, pertanian, perikanan, dan restoran dikenakan biaya tambahan Rp 500.000.</p>
    <p style='color: #777; font-size: 8.5pt;'>https://creativabridging.com/</p>
  </div>

  <!-- (jika full payment, payment info di page 1) -->
  " . (!$isCicilan ? "
  <div class='payment-box' style='margin-top:16px;'>
    <div class='payment-title'>Cara Pembayaran :</div>
    <div class='payment-step'>1. Transfer via ATM/Bank</div>
    <div class='bank-info'>
      Bank <b>BCA</b> &nbsp; No. Rekening <b>1832-918-428</b> &nbsp; atas nama <b>CREATIVA BRIDGING INTERN</b>
    </div>
    <div class='payment-step'>2. Cantumkan keterangan / berita Transfer dengan memasukkan Nomor Invoice di atas</div>
    <div class='payment-step'>
      Kirim Bukti Transfer ke email <b>finance@creativabridging.com</b> &amp; kirim ke WA <b>+62 815-2222-672</b>
    </div>
    <p class='confidential'>Invoice bersifat confidential (rahasia)</p>
    <p class='thanks'>Terimakasih telah bergabung dengan LPK CREATIVA</p>
  </div>
  
  <div class='signature-area'>
    <div class='sig-block'>
      <div class='sig-name'>Hormat kami,</div>
      <div class='sig-line'>
        <div style='font-weight:bold;font-size:9pt;'>LPK CREATIVA Team</div>
        <div style='font-size:7.5pt; color:#555;'>Finance &mdash; PT. Creativa Bridging International</div>
        <div style='font-size:7.5pt;'>https://creativabridging.com/</div>
        <div style='font-size:7.5pt;'>Telp/WA +62 815-2222-672</div>
      </div>
    </div>
    <div class='sig-block'>
      <div class='sig-name'>Diketahui Oleh,</div>
      <div class='sig-line'>
        <div style='font-weight:bold;font-size:9pt;'>Siti Nurhatifah</div>
        <div class='sig-title'>Direktur</div>
        <div class='sig-title'>PT. CREATIVA BRIDGING INTERNATIONAL</div>
      </div>
    </div>
  </div>
  " : "") . "

</div>

{$page2}

</body>
</html>";

    return $html;
}

// ─── Generate HTML Receipt / Kwitansi ────────────────────────────────────────
function generateReceiptHTML($d) {
    $html = "<!DOCTYPE html>
<html lang='id'>
<head>
<meta charset='UTF-8'>
<title>Kwitansi " . htmlspecialchars($d['nomor_receipt'] ?? $d['nomor_invoice'] ?? '') . "</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #222; }
  .page { width: 210mm; padding: 16mm; }
  .header { display: flex; justify-content: space-between; align-items: center; 
             border-bottom: 3px double #1a237e; padding-bottom: 12px; margin-bottom: 16px; }
  .logo-area { display: flex; align-items: center; gap: 14px; }
  .company-info { border-left: 2px solid #1a237e; padding-left: 12px; }
  .company-name { font-size: 11pt; font-weight: bold; color: #1a237e; letter-spacing: 0.5px; }
  .company-detail { font-size: 7.5pt; color: #444; margin-top: 1px; line-height: 1.35; }
  .kwitansi-title { font-size: 24pt; font-weight: 900; color: #1a237e; letter-spacing: 3px; line-height: 1; text-align: right; }
  .kwitansi-sub { font-size: 8pt; font-weight: bold; color: #059669; letter-spacing: 1px; text-align: right; margin-top: 4px; }
  .kwitansi-verified { font-size: 7pt; color: #64748b; text-align: right; margin-top: 1px; }
  
  .kwitansi-box { border: 2px solid #1a237e; border-radius: 6px; padding: 14px 16px; margin: 12px 0; }
  table.info { width: 100%; border-collapse: collapse; }
  table.info td { padding: 5px 6px; font-size: 9pt; vertical-align: top; }
  .label { color: #777; width: 190px; }
  
  .amount-box { border: 2px solid #1a237e; border-radius: 8px; text-align: center; padding: 16px; margin: 14px 0; background: #f8f9ff; }
  .amount-label { font-size: 8pt; color: #777; text-transform: uppercase; letter-spacing: 1px; }
  .amount-value { font-size: 22pt; font-weight: bold; color: #1a237e; margin: 4px 0; }
  .amount-words { font-style: italic; font-size: 8.5pt; color: #555; }
  
  .verified-box { background: #e8f5e9; border-left: 4px solid #43a047; padding: 8px 12px; font-size: 9pt; margin: 10px 0; }
  .sisa-box { background: #fff3e0; border-left: 4px solid #ff6f00; padding: 8px 12px; font-size: 9pt; margin: 10px 0; }
  
  .signature-area { display: flex; justify-content: space-between; margin-top: 20px; }
  .sig-block { text-align: center; width: 45%; }
  .sig-line { border-top: 1px solid #333; padding-top: 4px; font-size: 8.5pt; margin-top: 40px; }
  
  .perforated { border-top: 2px dashed #bbb; margin-top: 20px; padding-top: 10px; 
                 text-align: center; color: #aaa; font-size: 8pt; }
  .copy-siswa { margin-top: 12px; border: 1px solid #ddd; border-radius: 6px; padding: 10px 14px; font-size: 8.5pt; }
</style>
</head>
<body>
<div class='page'>
  <!-- KOP SURAT RESMI CREATIVA BRIDGING INTERNATIONAL -->
  <div class='header'>
    <div class='logo-area'>
      " . svgLogo() . "
      <div class='company-info'>
        <div class='company-name'>LPK CREATIVA BRIDGING INTERNATIONAL</div>
        <div class='company-detail'>Ruko Business Park, Jl. Ir. H. Juanda, Panembong, Ruko B1</div>
        <div class='company-detail'>Mekarsari, Kec. Cianjur, Kab. Cianjur, Jawa Barat 43211</div>
        <div class='company-detail'>Telp: +62 815-2222-672 &nbsp;|&nbsp; Web: creativabridging.com</div>
      </div>
    </div>
    <div>
      <div class='kwitansi-title'>KWITANSI</div>
      <div class='kwitansi-sub'>BUKTI PEMBAYARAN RESMI</div>
      <div class='kwitansi-verified'>TERVERIFIKASI SISTEM FINANCE</div>
    </div>
  </div>

  <!-- KWITANSI BOX -->
  <div class='kwitansi-box'>
    <table class='info'>
      <tr>
        <td class='label'>No. Kwitansi</td>
        <td>: <b>" . htmlspecialchars($d['nomor_receipt'] ?? $d['nomor_invoice'] ?? '-') . "</b></td>
        <td style='text-align:right;color:#555;font-size:8.5pt;'>Tanggal: <b>" . fmtDate($d['tanggal_bayar'] ?? date('Y-m-d')) . "</b></td>
      </tr>
      <tr>
        <td class='label'>Sudah Terima Dari</td>
        <td colspan='2'>: <b>" . htmlspecialchars($d['nama_siswa'] ?? '-') . "</b></td>
      </tr>
      <tr>
        <td class='label'>No. Invoice Referensi</td>
        <td colspan='2'>: " . htmlspecialchars($d['nomor_invoice'] ?? '-') . "</td>
      </tr>
      <tr>
        <td class='label'>Program / Batch</td>
        <td colspan='2'>: " . htmlspecialchars(($d['program'] ?? '-') . ' — ' . ($d['batch'] ?? '')) . "</td>
      </tr>
      <tr>
        <td class='label'>Metode Pembayaran</td>
        <td colspan='2'>: " . htmlspecialchars($d['metode_pembayaran'] ?? 'Transfer BCA') . "</td>
      </tr>
      <tr>
        <td class='label'>Keterangan</td>
        <td colspan='2'>: " . htmlspecialchars($d['keterangan'] ?? 'Pembayaran ' . ($d['tipe_pembayaran'] ?? 'Full Payment')) . "</td>
      </tr>
    </table>
  </div>

  <!-- AMOUNT -->
  <div class='amount-box'>
    <div class='amount-label'>Jumlah Dibayarkan</div>
    <div class='amount-value'>" . fmtRp($d['jumlah_bayar'] ?? 0) . "</div>
    " . (!empty($d['terbilang']) ? "<div class='amount-words'>Terbilang: <em>" . htmlspecialchars($d['terbilang']) . "</em></div>" : '') . "
  </div>

  " . (!empty($d['sisa_tagihan']) && $d['sisa_tagihan'] > 0 ? "
  <div class='sisa-box'>
    <b>Sisa Tagihan:</b> " . fmtRp($d['sisa_tagihan']) . "
    " . (!empty($d['jatuh_tempo_berikutnya']) ? "&nbsp;|&nbsp; <b>Jatuh Tempo Berikutnya:</b> " . fmtDate($d['jatuh_tempo_berikutnya']) : '') . "
  </div>" : '') . "

  <div class='verified-box'>
    ✅ Pembayaran ini telah <b>DIVERIFIKASI</b> dan diterima oleh tim Finance LPK Creativa Bridging International.
  </div>

  <!-- SIGNATURE -->
  <div class='signature-area'>
    <div class='sig-block'>
      <div style='font-size:8pt;'>Diterima oleh,</div>
      <div style='margin: 6px 0 2px;'>
        <div style='display:inline-block; border:1.5px solid #059669; color:#059669; padding:2px 8px; border-radius:4px; font-size:7pt; font-weight:bold; letter-spacing:0.5px; text-transform:uppercase;'>
          ✓ VERIFIED &amp; APPROVED (FINANCE)
        </div>
      </div>
      <div class='sig-line' style='margin-top:20px;'>
        <div style='font-weight:bold;'>LPK CREATIVA Team</div>
        <div style='font-size:7.5pt;'>Finance — PT. Creativa Bridging International</div>
      </div>
    </div>
    <div class='sig-block'>
      <div style='font-size:8pt;'>Cianjur, " . fmtDate($d['tanggal_bayar'] ?? date('Y-m-d')) . "</div>
      <div class='sig-line'>
        <div style='font-weight:bold;'>" . htmlspecialchars($d['nama_siswa'] ?? '') . "</div>
        <div style='font-size:7.5pt;'>Yang Membayar</div>
      </div>
    </div>
  </div>

  <!-- PERFORATED COPY -->
  <div class='perforated'>
    ✂ ─────────────── POTONG DISINI (LEMBAR SALINAN SISWA) ─────────────── ✂
  </div>
  <div class='copy-siswa'>
    <b>Bukti Pembayaran — Salinan Siswa</b><br>
    Nama: <b>" . htmlspecialchars($d['nama_siswa'] ?? '') . "</b> &nbsp;|&nbsp;
    Invoice: " . htmlspecialchars($d['nomor_invoice'] ?? '-') . " &nbsp;|&nbsp;
    Dibayar: <b>" . fmtRp($d['jumlah_bayar'] ?? 0) . "</b> &nbsp;|&nbsp;
    Tanggal: " . fmtDate($d['tanggal_bayar'] ?? date('Y-m-d')) . "
  </div>
</div>
</body>
</html>";

    return $html;
}

// ─── Simpan file ke uploads/invoices/ ──────────────────────────────────────────
function saveFile($html, $filename) {
    $dir = __DIR__ . '/../uploads/invoices/';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    file_put_contents($dir . $filename, $html);
    return '/uploads/invoices/' . $filename;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    header('Content-Type: application/json');

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON body']);
        exit;
    }

    try {
        $pdo = getDbConnection();

    if (empty($input['nomor_invoice'])) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS invoices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            participant_id INT DEFAULT 0,
            nomor_invoice VARCHAR(50),
            keterangan VARCHAR(255),
            nominal DECIMAL(15,2) DEFAULT 0,
            status VARCHAR(30) DEFAULT 'Menunggu',
            tipe VARCHAR(30) DEFAULT 'Lunas',
            tanggal_tagihan DATE,
            tanggal_bayar DATE,
            invoice_url VARCHAR(500),
            catatan TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        $input['nomor_invoice'] = generateNomorInvoice($pdo);
    }

    $tipe       = strtolower($input['tipe_pembayaran'] ?? 'fullpayment');
    $namaSiswa  = preg_replace('/\s+/', '-', strtoupper($input['nama_siswa'] ?? 'SISWA'));
    $nomorSlug  = preg_replace('/[^a-zA-Z0-9]/', '-', $input['nomor_invoice']);

    // Generate invoice HTML
    $invoiceHTML  = generateInvoiceHTML($input);
    $invFilename  = "INVOICE-{$nomorSlug}-{$namaSiswa}.html";
    $invPath      = saveFile($invoiceHTML, $invFilename);

    // Hitung total
    $subtotal = 0;
    foreach (($input['items'] ?? []) as $item) {
        $subtotal += (float)($item['harga'] ?? 0) * (int)($item['qty'] ?? 1);
    }
    foreach (($input['biaya_tambahan'] ?? []) as $item) {
        $subtotal += (float)($item['harga'] ?? 0) * (int)($item['qty'] ?? 1);
    }
    if ($subtotal == 0) $subtotal = (float)($input['total_biaya'] ?? 0);

    // Simpan ke DB
    $pdo->exec("CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        participant_id INT DEFAULT 0,
        nomor_invoice VARCHAR(50),
        keterangan VARCHAR(255),
        nominal DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'Menunggu',
        tipe VARCHAR(30) DEFAULT 'Lunas',
        tanggal_tagihan DATE,
        tanggal_bayar DATE,
        invoice_url VARCHAR(500),
        catatan TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $stmt = $pdo->prepare("
        INSERT INTO invoices (participant_id, nomor_invoice, keterangan, nominal, status, tipe, 
                              tanggal_tagihan, invoice_url, catatan, created_at)
        VALUES (?, ?, ?, ?, 'Menunggu', ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
            nominal=VALUES(nominal), status='Menunggu',
            tanggal_tagihan=VALUES(tanggal_tagihan),
            invoice_url=VALUES(invoice_url), updated_at=NOW()
    ");
    $stmt->execute([
        $input['siswa_id'] ?? 0,
        $input['nomor_invoice'],
        'Biaya Program ' . ($input['program'] ?? '') . ' — ' . ($input['batch'] ?? ''),
        $subtotal,
        $tipe === 'cicilan' ? 'Cicilan' : 'Lunas',
        $input['jatuh_tempo'] ?? $input['tanggal_invoice'] ?? date('Y-m-d'),
        $invPath,
        $input['catatan'] ?? null,
    ]);
    $invoiceId = $pdo->lastInsertId();

    // Simpan cicilan
    if ($tipe === 'cicilan' && !empty($input['cicilan'])) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS invoice_installments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            invoice_id INT, nomor_invoice VARCHAR(50),
            ke_cicilan INT, tanggal_jatuh_tempo DATE,
            nominal DECIMAL(15,2), status ENUM('Belum Dibayar','Dibayar') DEFAULT 'Belum Dibayar',
            tanggal_bayar DATE DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        $stmtC = $pdo->prepare("INSERT INTO invoice_installments 
            (invoice_id, nomor_invoice, ke_cicilan, tanggal_jatuh_tempo, nominal) 
            VALUES (?,?,?,?,?)");
        foreach ($input['cicilan'] as $c) {
            $stmtC->execute([$invoiceId, $input['nomor_invoice'], $c['ke'], $c['tanggal'] ?? null, $c['nominal'] ?? 0]);
        }
    }

    echo json_encode([
        'success'        => true,
        'nomor_invoice'  => $input['nomor_invoice'],
        'invoice_id'     => $invoiceId,
        'invoice_url'    => $invPath,
        'invoice_html'   => $invoiceHTML,
        'total'          => $subtotal,
        'tipe'           => $tipe,
        'message'        => 'Invoice berhasil dibuat: ' . $input['nomor_invoice'],
    ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
