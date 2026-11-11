<?php
/**
 * receipt_document.php
 * Render dokumen HTML Receipt / Kwitansi Pembayaran Resmi LPK Creativa Bridging International (layout A4).
 * Digunakan oleh Playwright Headless PDF Worker (n8n RPA Fase 2) maupun portal status kandidat bertoken.
 *
 * Akses wajib menyertakan:
 * - ?payment_id=<id>&token=<public_token> (atau ?id=<invoice_id>&token=<public_token>)
 * - ATAU header X-Webhook-Secret / ?api_key=CREATIVA_SYNC_SECRET_2026
 * - ATAU session aktif Finance / Admin ERP
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/rpa_automation.php';

header('Content-Type: text/plain; charset=utf-8');
$EXPECTED_SECRET = rpa_get_secret();

$paymentId = (int)($_GET['payment_id'] ?? 0);
$invoiceId = trim((string)($_GET['id'] ?? $_GET['invoice_id'] ?? ''));
$token     = trim((string)($_GET['token'] ?? ''));
$apiKey    = trim((string)($_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? $_GET['api_key'] ?? ''));
$isPrint   = isset($_GET['print']) && $_GET['print'] === '1';

if ($paymentId <= 0 && $invoiceId === '') {
    http_response_code(400);
    echo 'Parameter payment_id atau invoice id wajib diisi.';
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
        echo 'Akses ditolak: token receipt tidak valid.';
        exit;
    }
    $hasSecretAccess = true;
}

rpa_ensure_billing_columns($conn);

$payment = null;
if ($paymentId > 0) {
    $pStmt = $conn->prepare("SELECT * FROM `billing_pembayaran` WHERE id = ? LIMIT 1");
    if ($pStmt) {
        $pStmt->bind_param('i', $paymentId);
        $pStmt->execute();
        $payment = $pStmt->get_result()->fetch_assoc();
        $pStmt->close();
    }
    if (!$payment) {
        http_response_code(404);
        echo 'Data pembayaran tidak ditemukan.';
        exit;
    }
    $invoiceId = trim((string)($payment['noInv'] ?? $invoiceId));
} else {
    $pStmt = $conn->prepare("SELECT * FROM `billing_pembayaran` WHERE noInv = ? AND LOWER(TRIM(statusVerif)) IN ('terverifikasi','verified') ORDER BY id DESC LIMIT 1");
    if ($pStmt) {
        $pStmt->bind_param('s', $invoiceId);
        $pStmt->execute();
        $payment = $pStmt->get_result()->fetch_assoc();
        $pStmt->close();
    }
}

$invStmt = $conn->prepare("SELECT * FROM `billing_invoices` WHERE id = ? LIMIT 1");
if (!$invStmt) {
    http_response_code(500);
    echo 'Gagal menyiapkan query invoice.';
    exit;
}
$invStmt->bind_param('s', $invoiceId);
$invStmt->execute();
$invoice = $invStmt->get_result()->fetch_assoc();
$invStmt->close();

if (!$invoice) {
    http_response_code(404);
    echo 'Invoice referensi tidak ditemukan.';
    exit;
}

$storedToken = trim((string)($invoice['public_token'] ?? ''));
if (!$hasSecretAccess) {
    if ($storedToken === '' || !hash_equals($storedToken, $token)) {
        http_response_code(403);
        echo 'Token akses receipt tidak valid atau kedaluwarsa.';
        exit;
    }
}

$allPayments = [];
$verifiedPaidTotal = 0.0;
$allStmt = $conn->prepare("SELECT * FROM `billing_pembayaran` WHERE noInv = ? AND LOWER(TRIM(statusVerif)) IN ('terverifikasi','verified') ORDER BY id ASC");
if ($allStmt) {
    $allStmt->bind_param('s', $invoiceId);
    $allStmt->execute();
    $resAll = $allStmt->get_result();
    while ($row = $resAll->fetch_assoc()) {
        $allPayments[] = $row;
        $verifiedPaidTotal += (float)($row['jumlah'] ?? 0);
    }
    $allStmt->close();
}

$grandTotal = (float)($invoice['total'] ?? 0);
$statusLower = strtolower(trim((string)($invoice['status'] ?? '')));
if ($verifiedPaidTotal <= 0 && in_array($statusLower, ['paid', 'lunas'], true)) {
    $verifiedPaidTotal = $grandTotal;
}

if (!$payment) {
    // Fallback jika invoice sudah Paid manual tanpa baris di billing_pembayaran
    if (in_array($statusLower, ['paid', 'lunas'], true)) {
        $payment = [
            'id' => 0,
            'noInv' => $invoiceId,
            'tglBayar' => $invoice['tanggal'] ?? date('Y-m-d'),
            'customer' => $invoice['customer'] ?? '-',
            'metode' => 'Transfer Bank',
            'jumlah' => $grandTotal,
            'sisa' => 0,
            'statusVerif' => 'Terverifikasi',
        ];
    } else {
        http_response_code(404);
        echo 'Belum ada pembayaran terverifikasi untuk invoice ini.';
        exit;
    }
}

$meta = [];
if (!empty($invoice['meta_json'])) {
    $decoded = json_decode((string)$invoice['meta_json'], true);
    if (is_array($decoded)) $meta = $decoded;
}

function rct_fmt_comma($n, $withSpace = true): string {
    $prefix = $withSpace ? 'Rp ' : 'Rp';
    return $prefix . number_format((float)$n, 2, ',', '.');
}

function rct_fmt_date($str): string {
    if (!$str) return '-';
    $months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agust','Sep','Okt','Nov','Des'];
    $ts = strtotime((string)$str);
    if ($ts === false) return htmlspecialchars((string)$str);
    $m = (int)date('n', $ts) - 1;
    return ($months[$m] ?? '') . ' ' . (int)date('j', $ts) . ', ' . date('Y', $ts);
}

$payDate = (string)($payment['tglBayar'] ?? date('Y-m-d'));
$payAmt = (float)($payment['jumlah'] ?? 0);
$remainingTotal = max(0.0, $grandTotal - $verifiedPaidTotal);
$isFullyPaid = $remainingTotal <= 0.01;
$receiptNo = ((int)$payment['id'] > 0)
    ? rpa_format_receipt_number((int)$payment['id'], $payDate)
    : ('RCT-' . date('ym', strtotime($payDate) ?: time()) . '-0000');

$programTitle = trim((string)($meta['program'] ?? $invoice['keterangan'] ?? 'Program Pelatihan Bahasa Jepang'));
$lokasi = trim((string)($meta['lokasi'] ?? 'Cianjur'));
$terbilangText = rpa_terbilang($payAmt);
$installments = !empty($meta['installments']) && is_array($meta['installments']) ? $meta['installments'] : [];

// Cari termin berikutnya jika masih Partially Paid
$nextInstallment = null;
if (!$isFullyPaid && !empty($installments)) {
    $running = 0.0;
    foreach ($installments as $idx => $inst) {
        $nom = (float)($inst['nominal'] ?? $inst['amount'] ?? 0);
        $running += $nom;
        if ($verifiedPaidTotal + 1 < $running) {
            $nextInstallment = [
                'label' => strtoupper((string)($inst['keterangan'] ?? $inst['deskripsi'] ?? ('CICILAN KE-' . ($idx + 1)))),
                'due' => $inst['jatuhTempo'] ?? $inst['tanggal'] ?? '-',
                'due_amount' => max(0.0, min($nom, $running - $verifiedPaidTotal)),
            ];
            break;
        }
    }
}

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

$customerUpper = strtoupper((string)($payment['customer'] ?: ($invoice['customer'] ?? '-')));
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
<title>RECEIPT - <?= htmlspecialchars($receiptNo) ?> - <?= htmlspecialchars($customerUpper) ?></title>
<style>
  @page {
    size: A4;
    margin: 14mm 14mm 16mm 14mm;
  }
  * { box-sizing: border-box; }
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
  .kop-logo img { height: 54px; width: auto; object-fit: contain; }
  .kop-logo-fallback {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 700;
    font-size: 14pt;
    color: #1e3a8a;
    line-height: 1.2;
  }
  .kop-right { text-align: right; font-family: Georgia, "Times New Roman", serif; }
  .kop-title { margin: 0; font-size: 23pt; font-weight: 700; color: #065f46; line-height: 1; letter-spacing: 0.6px; }
  .kop-company { margin: 4px 0 2px; font-size: 9.5pt; font-weight: 700; color: #000; }
  .kop-addr { margin: 0; font-size: 8.5pt; color: #1f2937; line-height: 1.35; }

  .status-banner {
    margin: 16px 0 14px;
    padding: 10px 14px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: <?= $isFullyPaid ? '#ecfdf5' : '#fffbeb' ?>;
    border: 1px solid <?= $isFullyPaid ? '#a7f3d0' : '#fde68a' ?>;
  }
  .status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 9pt;
    font-weight: 700;
    color: #ffffff;
    background: <?= $isFullyPaid ? '#059669' : '#d97706' ?>;
    letter-spacing: 0.4px;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin: 12px 0 18px;
    gap: 16px;
  }
  .to-block .to-label { color: #64748b; font-size: 9.5pt; margin: 0 0 3px; }
  .to-block .to-name { font-size: 12pt; font-weight: 700; color: #000; text-transform: uppercase; margin: 0; }
  .to-block .to-contact { margin-top: 6px; color: #4b5563; font-size: 9pt; line-height: 1.45; }
  .meta-table { border-collapse: collapse; font-size: 9.5pt; }
  .meta-table td { padding: 2.5px 0; vertical-align: top; }
  .meta-table td.label { font-weight: 700; color: #000; text-align: right; padding-right: 8px; }
  .meta-table td.val { color: #111827; white-space: nowrap; }

  .terbilang-box {
    background: #f8fafc;
    border-left: 4px solid #163660;
    padding: 10px 14px;
    margin: 0 0 16px;
    font-size: 9.5pt;
  }
  .terbilang-box .lbl { font-size: 8.5pt; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.4px; }
  .terbilang-box .txt { font-size: 10.5pt; font-weight: 700; font-style: italic; color: #0f172a; margin-top: 2px; }

  .detail-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
    margin-bottom: 16px;
  }
  .detail-table th {
    background: #163660;
    color: #fff;
    text-align: left;
    padding: 8px 12px;
    font-weight: 700;
  }
  .detail-table th.right, .detail-table td.right { text-align: right; }
  .detail-table td {
    border-bottom: 1px solid #cbd5e1;
    padding: 10px 12px;
    vertical-align: top;
  }

  .summary-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
    page-break-inside: avoid;
  }
  .summary-table {
    width: 340px;
    border-collapse: collapse;
    font-size: 9.5pt;
  }
  .summary-table td { padding: 6px 4px; border-bottom: 1px solid #cbd5e1; }
  .summary-table tr:last-child td { border-bottom: 2px solid #0f172a; font-weight: 700; font-size: 10.5pt; }
  .summary-table td.lbl { color: #334155; font-weight: 600; }
  .summary-table td.amt { text-align: right; font-weight: 700; color: #000; white-space: nowrap; }

  .history-wrap { margin-top: 20px; page-break-inside: avoid; }
  .history-wrap h4 { margin: 0 0 8px; font-size: 10.5pt; color: #000; }
  .hist-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  .hist-table th, .hist-table td { border: 1px solid #cbd5e1; padding: 6px 10px; }
  .hist-table th { background: #f8fafc; font-weight: 700; text-align: left; }
  .hist-table td.right, .hist-table th.right { text-align: right; }
  .active-row { background: #ecfdf5; font-weight: 700; }

  .next-due-box {
    margin-top: 16px;
    padding: 10px 14px;
    border: 1px dashed #d97706;
    background: #fffbeb;
    border-radius: 6px;
    font-size: 9pt;
    color: #78350f;
  }

  .closing-row {
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    page-break-inside: avoid;
    font-size: 9pt;
  }
  .signature-block { text-align: left; }
  .stamp-box { margin: 4px 0 6px; }

  @media print {
    body { background: #fff; }
    .toolbar { display: none !important; }
    .sheet { max-width: none; margin: 0; padding: 0; box-shadow: none; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button class="btn-print" onclick="window.print()">Cetak / Simpan Receipt PDF</button>
  </div>

  <div class="sheet">
    <table class="print-layout">
      <thead>
        <tr>
          <td>
            <div class="kop-header">
              <div class="kop-logo">
                <?php if ($logoDataUri !== ''): ?>
                  <img src="<?= $logoDataUri ?>" alt="Creativa Bridging Internasional">
                <?php else: ?>
                  <div class="kop-logo-fallback">CREATIVA BRIDGING<br>INTERNATIONAL</div>
                <?php endif; ?>
              </div>
              <div class="kop-right">
                <h1 class="kop-title">RECEIPT</h1>
                <p class="kop-company">PT. Creativa Bridging International</p>
                <p class="kop-addr">Ruko Business Park, Jl. Ir. H. Juanda, Panembong, Ruko B1</p>
                <p class="kop-addr">Mekarsari, Kec. Cianjur, Kab. Cianjur, Jawa Barat 43211</p>
                <p class="kop-addr">+62 815-2222-672 | creativabridging.com</p>
              </div>
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="status-banner">
              <div>
                <div style="font-weight:700;color:#0f172a;font-size:10pt;">Bukti Pembayaran Resmi (Official Payment Receipt)</div>
                <div style="font-size:8.5pt;color:#475569;">Pembayaran ini telah diverifikasi dan tercatat dalam sistem Finance ONE Creativa.</div>
              </div>
              <span class="status-badge"><?= $isFullyPaid ? 'PAID (LUNAS)' : 'PARTIALLY PAID (CICILAN)' ?></span>
            </div>

            <div class="meta-row">
              <div class="to-block">
                <p class="to-label">Telah Diterima Dari,</p>
                <p class="to-name"><?= htmlspecialchars($customerUpper) ?></p>
                <div class="to-contact">
                  <?php if ($phone !== '' && $phone !== '-'): ?><div>Telp/WA: <?= htmlspecialchars($phone) ?></div><?php endif; ?>
                  <?php if ($email !== '' && $email !== '-'): ?><div>Email: <?= htmlspecialchars($email) ?></div><?php endif; ?>
                  <div>Lokasi Pelatihan: <?= htmlspecialchars($lokasi) ?></div>
                </div>
              </div>
              <div>
                <table class="meta-table">
                  <tr>
                    <td class="label">Receipt Number</td>
                    <td class="val">: <strong><?= htmlspecialchars($receiptNo) ?></strong></td>
                  </tr>
                  <tr>
                    <td class="label">Reference Invoice</td>
                    <td class="val">: <?= htmlspecialchars($invoiceId) ?></td>
                  </tr>
                  <tr>
                    <td class="label">Payment Date</td>
                    <td class="val">: <?= rct_fmt_date($payDate) ?></td>
                  </tr>
                  <tr>
                    <td class="label">Payment Method</td>
                    <td class="val">: <?= htmlspecialchars((string)($payment['metode'] ?? 'Transfer Bank')) ?></td>
                  </tr>
                </table>
              </div>
            </div>

            <div class="terbilang-box">
              <div class="lbl">Terbilang Nominal Pembayaran Ini</div>
              <div class="txt"># <?= htmlspecialchars($terbilangText) ?> #</div>
            </div>

            <table class="detail-table">
              <thead>
                <tr>
                  <th>Keterangan Pembayaran</th>
                  <th>Metode</th>
                  <th class="right">Jumlah Dibayar</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style="font-weight:700;color:#000;"><?= htmlspecialchars($programTitle) ?></div>
                    <div style="font-size:8.5pt;color:#475569;">Pembayaran atas tagihan Invoice #<?= htmlspecialchars($invoiceId) ?></div>
                  </td>
                  <td><?= htmlspecialchars((string)($payment['metode'] ?? 'Transfer Bank')) ?></td>
                  <td class="right" style="font-weight:700;color:#065f46;"><?= rct_fmt_comma($payAmt) ?></td>
                </tr>
              </tbody>
            </table>

            <div class="summary-wrap">
              <table class="summary-table">
                <tr>
                  <td class="lbl">Total Biaya Program (Invoice)</td>
                  <td class="amt"><?= rct_fmt_comma($grandTotal) ?></td>
                </tr>
                <tr>
                  <td class="lbl">Pembayaran Diterima (Receipt Ini)</td>
                  <td class="amt" style="color:#065f46;"><?= rct_fmt_comma($payAmt) ?></td>
                </tr>
                <tr>
                  <td class="lbl">Akumulasi Terbayar s.d. Sekarang</td>
                  <td class="amt"><?= rct_fmt_comma($verifiedPaidTotal) ?></td>
                </tr>
                <tr>
                  <td class="lbl">Sisa Tagihan (Remaining Balance)</td>
                  <td class="amt" style="color:<?= $isFullyPaid ? '#059669' : '#b45309' ?>;"><?= rct_fmt_comma($remainingTotal) ?></td>
                </tr>
              </table>
            </div>

            <?php if (count($allPayments) > 0): ?>
            <div class="history-wrap">
              <h4>Riwayat Pembayaran Terverifikasi untuk Invoice #<?= htmlspecialchars($invoiceId) ?></h4>
              <table class="hist-table">
                <thead>
                  <tr>
                    <th>No. Receipt</th>
                    <th>Tanggal Bayar</th>
                    <th>Metode</th>
                    <th class="right">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  <?php foreach ($allPayments as $ap):
                    $apId = (int)$ap['id'];
                    $apNo = rpa_format_receipt_number($apId, (string)$ap['tglBayar']);
                    $isCurrent = ((int)$payment['id'] === $apId);
                  ?>
                    <tr class="<?= $isCurrent ? 'active-row' : '' ?>">
                      <td><?= htmlspecialchars($apNo) ?><?= $isCurrent ? ' (Dokumen ini)' : '' ?></td>
                      <td><?= rct_fmt_date($ap['tglBayar']) ?></td>
                      <td><?= htmlspecialchars((string)$ap['metode']) ?></td>
                      <td class="right"><?= rct_fmt_comma($ap['jumlah']) ?></td>
                    </tr>
                  <?php endforeach; ?>
                </tbody>
              </table>
            </div>
            <?php endif; ?>

            <?php if ($nextInstallment): ?>
            <div class="next-due-box">
              <strong>Informasi Termin Berikutnya:</strong> <?= htmlspecialchars($nextInstallment['label']) ?>
              — Jatuh Tempo: <strong><?= rct_fmt_date($nextInstallment['due']) ?></strong>
              — Perkiraan Nominal: <strong><?= rct_fmt_comma($nextInstallment['due_amount']) ?></strong>.
              Rekening Resmi: Bank BCA 1832-918-428 a/n CREATIVA BRIDGING INTERN.
            </div>
            <?php endif; ?>

            <div class="closing-row">
              <div style="color:#475569;line-height:1.55;">
                <div><strong>LPK CREATIVA Team</strong></div>
                <div>https://creativabridging.com/</div>
                <div>Email: finance@creativabridging.com | WA: +62 815-2222-672</div>
                <div style="font-size:8pt;color:#64748b;margin-top:6px;">
                  Dokumen ini diterbitkan secara elektronik oleh sistem ONE Creativa dan sah tanpa tanda tangan basah tambahan.
                </div>
              </div>
              <div class="signature-block">
                <div>Diverifikasi &amp; Diterima Oleh,</div>
                <div class="stamp-box">
                  <canvas id="director-stamp" width="560" height="220" style="height: 82px; width: auto; display: block;"></canvas>
                </div>
                <div style="font-weight:700;">Siti Nurhatifah</div>
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
