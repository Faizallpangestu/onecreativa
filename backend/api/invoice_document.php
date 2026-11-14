<?php
/**
 * invoice_document.php
 * Render dokumen HTML Invoice Resmi LPK Creativa Bridging International (layout A4)
 * Digunakan oleh Playwright Headless PDF Worker (n8n RPA Fase 1) maupun portal kandidat bertoken.
 *
 * Akses wajib menyertakan:
 * - ?id=<invoice_id>&token=<public_token>
 * - ATAU header X-Webhook-Secret / ?api_key=CREATIVA_SYNC_SECRET_2026
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/rpa_automation.php';

header('Content-Type: text/plain; charset=utf-8');
$EXPECTED_SECRET = rpa_get_secret();

$invoiceId = trim((string)($_GET['id'] ?? ''));
$token     = trim((string)($_GET['token'] ?? ''));
$apiKey    = trim((string)($_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? $_GET['api_key'] ?? ''));
$isPrint   = isset($_GET['print']) && $_GET['print'] === '1';

if ($invoiceId === '') {
    http_response_code(400);
    echo 'Parameter invoice id wajib diisi.';
    exit;
}

$hasSecretAccess = ($apiKey !== '' && hash_equals($EXPECTED_SECRET, $apiKey));

if (!$hasSecretAccess && $token === '') {
    require_once __DIR__ . '/../config/session.php';
    $erpActor = session_actor($conn);
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }
    if (!$erpActor) {
        http_response_code(403);
        echo 'Akses ditolak: token invoice tidak valid.';
        exit;
    }
    $hasSecretAccess = true;
}

// Pastikan kolom public_token & meta_json tersedia agar query aman pada DB lama
foreach (['public_token' => 'VARCHAR(64) NULL', 'meta_json' => 'LONGTEXT NULL'] as $col => $def) {
    $chk = @mysqli_query($conn, "SHOW COLUMNS FROM `billing_invoices` LIKE '{$col}'");
    if ($chk && mysqli_num_rows($chk) === 0) {
        @mysqli_query($conn, "ALTER TABLE `billing_invoices` ADD COLUMN `{$col}` {$def}");
    }
}

$stmt = $conn->prepare("SELECT * FROM `billing_invoices` WHERE id = ? LIMIT 1");
if (!$stmt) {
    http_response_code(500);
    echo 'Gagal menyiapkan query invoice.';
    exit;
}
$stmt->bind_param('s', $invoiceId);
$stmt->execute();
$invoice = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$invoice) {
    http_response_code(404);
    echo 'Invoice tidak ditemukan.';
    exit;
}

$storedToken = trim((string)($invoice['public_token'] ?? ''));
if (!$hasSecretAccess) {
    if ($storedToken === '' || !hash_equals($storedToken, $token)) {
        http_response_code(403);
        echo 'Token akses invoice tidak valid atau kedaluwarsa.';
        exit;
    }
}

// Ambil total pembayaran terverifikasi jika ada
$paidTotal = 0.0;
$payStmt = $conn->prepare("SELECT COALESCE(SUM(jumlah), 0) AS paid FROM `billing_pembayaran` WHERE noInv = ? AND LOWER(TRIM(statusVerif)) IN ('terverifikasi','verified')");
if ($payStmt) {
    $payStmt->bind_param('s', $invoiceId);
    $payStmt->execute();
    $payRow = $payStmt->get_result()->fetch_assoc();
    $paidTotal = (float)($payRow['paid'] ?? 0);
    $payStmt->close();
}

$meta = [];
if (!empty($invoice['meta_json'])) {
    $decoded = json_decode((string)$invoice['meta_json'], true);
    if (is_array($decoded)) $meta = $decoded;
}

// Helpers formatting persis template resmi gambar 2-8
function inv_fmt_no_dec($n) {
    return number_format((float)$n, 0, ',', '.');
}
function inv_fmt_comma($n, $withSpace = false) {
    $prefix = $withSpace ? 'Rp ' : 'Rp';
    return $prefix . number_format((float)$n, 2, ',', '.');
}
function inv_parse_date_ts($str) {
    if (!$str) return false;
    $ts = strtotime((string)$str);
    return $ts !== false ? $ts : false;
}
function inv_fmt_date_short($str) {
    $months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agust','Sep','Okt','Nov','Des'];
    $ts = inv_parse_date_ts($str);
    if ($ts === false) return $str ? htmlspecialchars((string)$str) : '-';
    $m = (int)date('n', $ts) - 1;
    $d = (int)date('j', $ts);
    $y = date('Y', $ts);
    return ($months[$m] ?? '') . " {$d}, {$y}";
}
function inv_fmt_date_upper($str) {
    $months = ['JANUARI','FEBRUARI','MARET','APRIL','MEI','JUNI','JULI','AGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DESEMBER'];
    $ts = inv_parse_date_ts($str);
    if ($ts === false) return $str ? htmlspecialchars(strtoupper((string)$str)) : '-';
    $m = (int)date('n', $ts) - 1;
    $d = str_pad((string)date('j', $ts), 2, '0', STR_PAD_LEFT);
    $y = date('Y', $ts);
    return ($months[$m] ?? '') . " {$d}, {$y}";
}

$grandTotal = (float)($invoice['total'] ?? 0);
$statusLower = strtolower(trim((string)($invoice['status'] ?? 'unpaid')));
if ($paidTotal <= 0 && in_array($statusLower, ['paid', 'lunas'], true)) {
    $paidTotal = $grandTotal;
}
$amountDue = max(0.0, $grandTotal - $paidTotal);
$subtotal = isset($meta['subtotal']) ? (float)$meta['subtotal'] : $grandTotal;
$discountAmount = isset($meta['discount']['amount']) ? (float)$meta['discount']['amount'] : max(0.0, $subtotal - $grandTotal);

$items = !empty($meta['items']) && is_array($meta['items']) ? $meta['items'] : [[
    'deskripsi' => $meta['program'] ?? ($invoice['keterangan'] ?: 'Kelas Intensif Offline (Full Payment)'),
    'subdeskripsi' => 'Biaya Pendidikan Bahasa Jepang dan Pelatihan Skill - ' . ($meta['lokasi'] ?? 'Cianjur'),
    'harga' => $grandTotal,
    'jumlah' => $grandTotal,
    'diskon' => 0,
]];

$includes = !empty($meta['includes']) && is_array($meta['includes']) ? $meta['includes'] : [
    'Kelas Bahasa Jepang Level N5 & N4',
    'Kelas Persiapan Ujian JFT & SSW',
    'Biaya Ujian JFT A2.2 & SSW (masing-masing tercover 1x)',
    'Buku & Materi Pelajaran',
    'Panel & Moodle (Learning Online System for Student)',
    'Seragam, ID Card & Suripa',
    'Sertifikat Kompetensi LPK',
    'Fasilitas Kelas & Asrama selama 7 bulan',
    'Praktek & Kegiatan LPK (FMD, Kunjungan Matsuri, Bukber, Acara Kelulusan, dll) *kondisional',
    'Konsultasi Pendidikan/Pelatihan & Peluang Karir di Jepang (kapan pun selama Pelatihan)',
];

$excludes = !empty($meta['excludes']) && is_array($meta['excludes']) ? $meta['excludes'] : [
    'Biaya Utilitas (Air, Listrik, Internet, & IPL Asrama per Bulan)',
    'Biaya Makan',
    'Keperluan Pribadi Lainnya',
];

$installments = !empty($meta['installments']) && is_array($meta['installments']) ? $meta['installments'] : [[
    'keterangan' => 'FULL PAYMENT',
    'jatuhTempo' => $invoice['jatuhTempo'] ?: $invoice['tanggal'],
    'nominal' => $grandTotal,
]];

$bankName      = trim((string)($meta['bank_name'] ?? ''));
$accountNumber = trim((string)($meta['account_number'] ?? ''));
$accountHolder = trim((string)($meta['account_holder'] ?? ''));

$customNotesRaw = trim((string)($meta['notes'] ?? ''));
$isBoilerplate = (stripos($customNotesRaw, 'Cara Pembayaran') !== false || stripos($customNotesRaw, 'Invoice ini bersifat confidential') !== false);
$customNotes = ($customNotesRaw !== '' && !$isBoilerplate) ? $customNotesRaw : '';

// Encode logo lokal ke base64 agar rendering Playwright offline/terisolasi tetap 100% akurat
$logoDataUri = '';
foreach ([
    __DIR__ . '/../../public/images/creativa-kop-logo.png',
    __DIR__ . '/../images/creativa-kop-logo.png',
    __DIR__ . '/../../images/creativa-kop-logo.png',
] as $logoPath) {
    if (is_file($logoPath)) {
        $rawLogo = @file_get_contents($logoPath);
        if ($rawLogo !== false) {
            $logoDataUri = 'data:image/png;base64,' . base64_encode($rawLogo);
            break;
        }
    }
}

$customerUpper = strtoupper((string)($invoice['customer'] ?? '-'));
$phone = trim((string)($invoice['phone'] ?? ''));
$email = trim((string)($invoice['email'] ?? ''));
header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>INVOICE - <?= htmlspecialchars($invoiceId) ?> - <?= htmlspecialchars($customerUpper) ?></title>
<style>
  @page {
    size: A4;
    margin: 14mm 14mm 16mm 14mm;
  }
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    color: #111827;
    background: #f1f5f9;
    line-height: 1.48;
  }
  .toolbar {
    max-width: 210mm;
    margin: 14px auto 0;
    padding: 0 6px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  .btn-print {
    background: #163660;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }
  .sheet {
    max-width: 210mm;
    margin: 12px auto 28px;
    background: #ffffff;
    padding: 14mm 14mm 16mm;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
  }
  .print-layout {
    width: 100%;
    border-collapse: collapse;
  }
  .print-layout > thead > tr > td,
  .print-layout > tbody > tr > td {
    padding: 0;
  }
  .print-head-spacer {
    height: 10px;
  }
  /* Kop Surat (Gambar 1) */
  .kop-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 10px;
    border-bottom: 2.5px solid #1e3a8a;
    position: relative;
    margin-bottom: 4px;
  }
  .kop-header::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -4.5px;
    border-bottom: 1px solid #1e3a8a;
  }
  .kop-logo img {
    height: 54px;
    width: auto;
    object-fit: contain;
  }
  .kop-logo-fallback {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 700;
    font-size: 14pt;
    color: #1e3a8a;
    line-height: 1.2;
  }
  .kop-right {
    text-align: right;
    font-family: Georgia, "Times New Roman", serif;
  }
  .kop-title {
    margin: 0;
    font-size: 24pt;
    font-weight: 700;
    color: #000000;
    line-height: 1;
    letter-spacing: 0.5px;
  }
  .kop-company {
    margin: 4px 0 2px;
    font-size: 9.5pt;
    font-weight: 700;
    color: #000000;
  }
  .kop-addr {
    margin: 0;
    font-size: 8.5pt;
    color: #1f2937;
    line-height: 1.35;
  }

  /* Customer & Invoice Meta (Gambar 2) */
  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin: 22px 0 18px;
    gap: 16px;
  }
  .to-block .to-label {
    color: #64748b;
    font-size: 10pt;
    margin: 0 0 4px;
  }
  .to-block .to-name {
    font-size: 12pt;
    font-weight: 700;
    color: #000;
    text-transform: uppercase;
    margin: 0;
  }
  .to-block .to-contact {
    margin-top: 12px;
    color: #6b7280;
    font-size: 9.5pt;
    line-height: 1.45;
  }
  .meta-table {
    border-collapse: collapse;
    font-size: 9.5pt;
  }
  .meta-table td {
    padding: 2px 0;
    vertical-align: top;
  }
  .meta-table td.label {
    font-weight: 700;
    color: #000;
    text-align: right;
    padding-right: 8px;
  }
  .meta-table td.val {
    color: #111827;
    white-space: nowrap;
  }

  /* Items Bar & Content */
  .items-bar {
    background: #163660;
    color: #ffffff;
    font-weight: 700;
    font-size: 9.5pt;
    display: grid;
    grid-template-columns: 1fr 110px 110px;
    padding: 7px 12px;
  }
  .items-bar .right {
    text-align: right;
  }
  .item-row {
    display: grid;
    grid-template-columns: 1fr 110px 110px;
    padding: 12px 10px 6px;
    align-items: start;
  }
  .item-title {
    font-weight: 700;
    font-size: 10pt;
    color: #000;
    margin: 0;
  }
  .item-sub {
    color: #374151;
    font-size: 9.5pt;
    margin: 2px 0 0;
  }
  .item-num {
    text-align: right;
    font-weight: 700;
    font-size: 10pt;
    color: #000;
  }

  .list-section {
    padding: 6px 10px 4px;
    font-size: 9.5pt;
    color: #1f2937;
  }
  .list-section h4 {
    margin: 6px 0 4px;
    font-size: 10pt;
    font-weight: 700;
    color: #000;
  }
  .list-section ol {
    margin: 0;
    padding-left: 26px;
  }
  .list-section li {
    margin-bottom: 2px;
  }

  /* Totals Rules (Gambar 5) */
  .totals-wrap {
    border-top: 1.2px solid #1e293b;
    margin-top: 14px;
    padding-top: 4px;
    display: flex;
    justify-content: flex-end;
    page-break-inside: avoid;
  }
  .totals-table {
    width: 300px;
    border-collapse: collapse;
    font-size: 10pt;
  }
  .totals-table td {
    padding: 6px 4px;
    border-bottom: 1px solid #64748b;
  }
  .totals-table tr:last-child td {
    border-bottom: none;
    font-weight: 700;
  }
  .totals-table td.lbl {
    font-weight: 700;
    text-align: right;
    padding-right: 16px;
    color: #000;
  }
  .totals-table td.amt {
    text-align: right;
    color: #000;
    white-space: nowrap;
  }

  /* Installment Table (Gambar 6) */
  .installment-wrap {
    margin-top: 22px;
    page-break-inside: avoid;
  }
  .installment-wrap h3 {
    margin: 0 0 8px;
    font-size: 15pt;
    font-weight: 700;
    color: #000;
  }
  .inst-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
  }
  .inst-table th, .inst-table td {
    border: 1px solid #cbd5e1;
    padding: 7px 10px;
    color: #000;
  }
  .inst-table th {
    background: #ffffff;
    font-weight: 700;
    text-align: left;
  }
  .inst-table th.right, .inst-table td.right {
    text-align: right;
  }

  /* Notes & Payment & Signature (Gambar 6-8) */
  .notes-wrap {
    margin-top: 22px;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  .notes-wrap h4 {
    margin: 0 0 6px;
    font-size: 10.5pt;
    font-weight: 700;
    color: #000;
  }
  .notes-wrap .site-url {
    color: #6b7280;
    font-size: 9pt;
    margin-top: 6px;
  }
  .closing-wrap {
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid #cbd5e1;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  .pay-list {
    margin: 6px 0 0;
    padding-left: 22px;
  }
  .pay-list li {
    margin-bottom: 4px;
  }
  .email-link {
    color: #1d4ed8;
    text-decoration: underline;
  }
  .team-block {
    margin-top: 20px;
    line-height: 1.5;
  }
  .signature-block {
    margin-top: 20px;
    page-break-inside: avoid;
  }
  .stamp-box {
    margin: 4px 0 6px;
  }

  @media print {
    body {
      background: #ffffff;
    }
    .toolbar {
      display: none !important;
    }
    .sheet {
      max-width: none;
      margin: 0;
      padding: 0;
      box-shadow: none;
    }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button class="btn-print" onclick="window.print()">Cetak / Simpan PDF</button>
    <?php if (!$isPrint && $amountDue > 0 && $storedToken !== ''):
      $pubPayStatusUrl = rpa_build_public_urls($invoiceId, $storedToken)['status_url'];
    ?>
      <a class="btn-print" style="background:#059669;text-decoration:none;margin-left:8px;display:inline-flex;align-items:center;" href="<?= htmlspecialchars($pubPayStatusUrl) ?>" target="_blank" rel="noopener noreferrer">
        Bayar Online (QRIS / VA)
      </a>
    <?php endif; ?>
  </div>

  <div class="sheet">
    <table class="print-layout">
      <thead>
        <tr>
          <td>
            <!-- KOP SURAT RESMI (Mengulang otomatis di setiap halaman cetak/PDF) -->
            <div class="kop-header">
              <div class="kop-logo">
                <?php if ($logoDataUri !== ''): ?>
                  <img src="<?= $logoDataUri ?>" alt="Creativa Bridging Internasional">
                <?php else: ?>
                  <div class="kop-logo-fallback">CREATIVA BRIDGING<br>INTERNATIONAL</div>
                <?php endif; ?>
              </div>
              <div class="kop-right">
                <h1 class="kop-title">INVOICE</h1>
                <p class="kop-company">PT. Creativa Bridging International</p>
                <p class="kop-addr">Ruko Business Park, Jl. Ir. H. Juanda, Panembong, Ruko B1</p>
                <p class="kop-addr">Mekarsari, Kec. Cianjur, Kab. Cianjur, Jawa Barat 43211</p>
                <p class="kop-addr">+62 815-2222-672 | creativabridging.com</p>
              </div>
            </div>
            <div class="print-head-spacer"></div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>

    <!-- META DATA -->
    <div class="meta-row">
      <div class="to-block">
        <p class="to-label">To,</p>
        <p class="to-name"><?= htmlspecialchars($customerUpper) ?></p>
        <?php if (($phone !== '' && $phone !== '-') || ($email !== '' && $email !== '-')): ?>
          <div class="to-contact">
            <?php if ($phone !== '' && $phone !== '-'): ?><div><?= htmlspecialchars($phone) ?></div><?php endif; ?>
            <?php if ($email !== '' && $email !== '-'): ?><div><?= htmlspecialchars($email) ?></div><?php endif; ?>
          </div>
        <?php endif; ?>
      </div>
      <div>
        <table class="meta-table">
          <tr>
            <td class="label">Invoice Number</td>
            <td class="val">: <?= htmlspecialchars($invoiceId) ?></td>
          </tr>
          <tr>
            <td class="label">Invoice Date</td>
            <td class="val">: <?= inv_fmt_date_short($invoice['tanggal'] ?? date('Y-m-d')) ?></td>
          </tr>
          <tr>
            <td class="label">Payment Due</td>
            <td class="val">: <?= inv_fmt_date_short($invoice['jatuhTempo'] ?? $invoice['tanggal'] ?? date('Y-m-d')) ?></td>
          </tr>
          <tr>
            <td class="label">Amount Due</td>
            <td class="val">: <?= inv_fmt_comma($amountDue) ?></td>
          </tr>
        </table>
      </div>
    </div>

    <!-- ITEMS BAR -->
    <div class="items-bar">
      <div>Items</div>
      <div class="right">Price</div>
      <div class="right">Amount</div>
    </div>

    <?php foreach ($items as $it):
      $price = (float)($it['harga'] ?? $it['price'] ?? 0);
      $diskon = (float)($it['diskon'] ?? 0);
      $amt = (float)($it['amount'] ?? max(0, (float)($it['jumlah'] ?? $price) - $diskon));
    ?>
      <div class="item-row">
        <div>
          <p class="item-title"><?= htmlspecialchars((string)($it['deskripsi'] ?? $it['name'] ?? 'Program Pelatihan')) ?></p>
          <?php if (!empty($it['subdeskripsi']) || !empty($it['subtitle'])): ?>
            <p class="item-sub"><?= htmlspecialchars((string)($it['subdeskripsi'] ?? $it['subtitle'])) ?></p>
          <?php endif; ?>
        </div>
        <div class="item-num"><?= inv_fmt_no_dec($price) ?></div>
        <div class="item-num"><?= inv_fmt_no_dec($amt) ?></div>
      </div>
    <?php endforeach; ?>

    <!-- BIAYA SUDAH & TIDAK TERMASUK -->
    <div class="list-section">
      <h4>Biaya Sudah Termasuk:</h4>
      <ol>
        <?php foreach ($includes as $inc): ?>
          <li><?= htmlspecialchars((string)$inc) ?></li>
        <?php endforeach; ?>
      </ol>

      <h4 style="margin-top: 12px;">Biaya Tidak Termasuk:</h4>
      <ol>
        <?php foreach ($excludes as $exc): ?>
          <li><?= htmlspecialchars((string)$exc) ?></li>
        <?php endforeach; ?>
      </ol>
    </div>

    <!-- TOTALS -->
    <div class="totals-wrap">
      <table class="totals-table">
        <tr>
          <td class="lbl">Subtotal:</td>
          <td class="amt"><?= inv_fmt_comma($subtotal) ?></td>
        </tr>
        <?php if ($discountAmount > 0): ?>
        <tr>
          <td class="lbl">Discount:</td>
          <td class="amt">- <?= inv_fmt_comma($discountAmount) ?></td>
        </tr>
        <?php endif; ?>
        <tr>
          <td class="lbl">Total:</td>
          <td class="amt"><?= inv_fmt_comma($grandTotal) ?></td>
        </tr>
        <tr>
          <td class="lbl">Amount Due (IDR):</td>
          <td class="amt"><?= inv_fmt_comma($amountDue, true) ?></td>
        </tr>
      </table>
    </div>

    <!-- INSTALLMENT -->
    <div class="installment-wrap">
      <h3>Installment</h3>
      <table class="inst-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Date</th>
            <th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($installments as $idx => $inst):
            $desc = strtoupper((string)($inst['keterangan'] ?? $inst['deskripsi'] ?? $inst['label'] ?? (count($installments) === 1 ? 'FULL PAYMENT' : 'CICILAN KE-' . ($idx + 1))));
            $instDate = $inst['jatuhTempo'] ?? $inst['tanggal'] ?? $invoice['jatuhTempo'] ?? $invoice['tanggal'];
            $instNom = (float)($inst['nominal'] ?? $inst['amount'] ?? 0);
          ?>
            <tr>
              <td><?= htmlspecialchars($desc) ?></td>
              <td><?= inv_fmt_date_upper($instDate) ?></td>
              <td class="right"><?= inv_fmt_comma($instNom) ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>

    <!-- NOTES / TERMS -->
    <div class="notes-wrap">
      <h4>Notes/Terms</h4>
      <p style="margin: 0 0 6px;">
        Biaya ujian SSW selain program SSW kaigo, pengolahan makanan, pertanian, perikanan, dan restoran dikenakan biaya tambahan Rp 500.000.
      </p>
      <?php if ($customNotes !== ''): ?>
        <p style="margin: 0 0 6px;"><?= nl2br(htmlspecialchars($customNotes)) ?></p>
      <?php endif; ?>
      <p class="site-url">https://creativabridging.com/</p>
    </div>

    <!-- CARA PEMBAYARAN & TTD DIREKTUR -->
    <div class="closing-wrap">
      <p style="margin: 0 0 12px;">Invoice bersifat confidential (rahasia)</p>
      <p style="margin: 0;">Cara Pembayaran :</p>
      <ol class="pay-list">
        <li>
          <div>Transfer via ATM/Bank</div>
          <div>Bank <?= htmlspecialchars($bankName) ?> No. Rekening <?= htmlspecialchars($accountNumber) ?> atas nama <?= htmlspecialchars($accountHolder) ?></div>
        </li>
        <li>Cantumkan keterangan / berita Transfer dengan memasukkan Nomor Invoice diatas</li>
        <li>Kirim Bukti Transfer ke email <span class="email-link">finance@creativabridging.com</span></li>
      </ol>

      <p style="margin: 18px 0 0;">Terimakasih telah bergabung dengan LPK CREATIVA</p>

      <div class="team-block">
        <div>LPK CREATIVA Team</div>
        <div>https://creativabridging.com/</div>
        <div>Telp/SMS/WA +81 80-7948-7205</div>
      </div>

      <div class="signature-block">
        <div>Diketahui Oleh,</div>
        <div class="stamp-box">
          <canvas id="director-stamp" width="560" height="220" style="height: 82px; width: auto; display: block;"></canvas>
        </div>
        <div>Siti Nurhatifah</div>
        <div>Direktur</div>
      </div>
    </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

<script>
(function drawStampAndSignature() {
  var canvas = document.getElementById('director-stamp');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var cx = 368, cy = 110, trackR = 75;

  function arcText(text, r, startAngle, step, inward) {
    ctx.save();
    for (var i = 0; i < text.length; i++) {
      var a = startAngle + i * step;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.rotate(a + (inward ? -Math.PI / 2 : Math.PI / 2));
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  function star(x, y, oR, iR) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var r = i % 2 === 0 ? oR : iR;
      var a = -Math.PI / 2 + (i * Math.PI) / 5;
      var px = x + Math.cos(a) * r;
      var py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.strokeStyle = '#1a52b8';
  ctx.fillStyle = '#1a52b8';

  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 92, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, 58, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  for (var k = 0; k < 4; k++) {
    ctx.save();
    ctx.rotate((k * Math.PI) / 2);
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

  ctx.font = 'bold 20px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  arcText('CREATIVA BRIDGING', trackR, -Math.PI / 2 - 1.525, 3.05 / 16, false);
  arcText('INTERNATIONAL', trackR, Math.PI / 2 + 1.075, -2.15 / 12, true);
  star(cx - 73, cy + 16, 5.5, 2.3);
  star(cx + 73, cy + 16, 5.5, 2.3);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#0f172a';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.lineWidth = 4.6;
  ctx.beginPath();
  ctx.moveTo(148, 56);
  ctx.bezierCurveTo(108, 24, 52, 58, 72, 92);
  ctx.bezierCurveTo(88, 118, 174, 122, 162, 148);
  ctx.bezierCurveTo(150, 174, 48, 152, 42, 124);
  ctx.bezierCurveTo(38, 106, 92, 98, 154, 112);
  ctx.stroke();

  ctx.lineWidth = 4.4;
  ctx.beginPath();
  ctx.moveTo(142, 34);
  ctx.bezierCurveTo(126, 70, 118, 154, 126, 188);
  ctx.bezierCurveTo(132, 198, 150, 184, 152, 148);
  ctx.bezierCurveTo(154, 108, 162, 58, 168, 44);
  ctx.bezierCurveTo(170, 82, 170, 126, 174, 146);
  ctx.stroke();

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
})();
<?php if ($isPrint): ?>
window.addEventListener('load', function () { window.print(); });
<?php endif; ?>
</script>
</body>
</html>
