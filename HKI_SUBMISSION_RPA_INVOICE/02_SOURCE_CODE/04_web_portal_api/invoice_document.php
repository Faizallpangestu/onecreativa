<?php
/**
 * invoice_document.php
 * Render Dokumen Lembar Tagihan / Invoice Resmi LPK Creativa Bridging International.
 * Dapat diakses langsung oleh siswa (dari dashboard / email) untuk melihat dan mencetak PDF resmi.
 *
 * Mendukung parameter:
 * - ?id=<nomor_invoice_atau_cicilan> (misal: TGCJ26110002 atau TGCJ26110002-1)
 * - ?inv=<nomor_invoice>
 * - ?token=<token>
 * - ?print=1 (otomatis memicu dialog Cetak/Simpan PDF pada browser)
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/invoice_generator.php';

header('Content-Type: text/html; charset=utf-8');

$pdo = getDbConnection();

$invoiceId = trim((string)($_GET['id'] ?? $_GET['invoice_id'] ?? $_GET['inv'] ?? ''));
$isPrint   = isset($_GET['print']) && $_GET['print'] === '1';

if ($invoiceId === '') {
    http_response_code(400);
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Error</title><body style="font-family:sans-serif;padding:40px;text-align:center;"><h2>Nomor Invoice tidak ditemukan.</h2><p><a href="/siswa/dashboard">Kembali ke Dashboard Siswa</a></p></body></html>';
    exit;
}

// ── 1. Cari baris invoice yang sesuai ──
$targetInvoice = null;
$stmt = $pdo->prepare("SELECT * FROM invoices WHERE nomor_invoice = ? LIMIT 1");
$stmt->execute([$invoiceId]);
$targetInvoice = $stmt->fetch();

if (!$targetInvoice) {
    $prefix = preg_replace('/-[0-9]+$/', '', $invoiceId);
    $stmt = $pdo->prepare("SELECT * FROM invoices WHERE nomor_invoice LIKE ? ORDER BY id ASC LIMIT 1");
    $stmt->execute([$prefix . '%']);
    $targetInvoice = $stmt->fetch();
}

if (!$targetInvoice && is_numeric($invoiceId)) {
    $stmt = $pdo->prepare("SELECT * FROM invoices WHERE id = ? LIMIT 1");
    $stmt->execute([(int)$invoiceId]);
    $targetInvoice = $stmt->fetch();
}

if (!$targetInvoice) {
    http_response_code(404);
    echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice Tidak Ditemukan</title><body style="font-family:sans-serif;padding:40px;text-align:center;"><h2>Invoice #' . htmlspecialchars($invoiceId) . ' tidak ditemukan di sistem.</h2><p><a href="/siswa/dashboard">Kembali ke Dashboard Siswa</a></p></body></html>';
    exit;
}

// ── 2. Ambil data siswa (Participant) ──
$participantId = (int)$targetInvoice['participant_id'];
$stmtP = $pdo->prepare("SELECT * FROM participants WHERE id = ? LIMIT 1");
$stmtP->execute([$participantId]);
$participant = $stmtP->fetch();

// ── 3. Ambil seluruh cicilan siswa ──
$stmtAll = $pdo->prepare("SELECT * FROM invoices WHERE participant_id = ? ORDER BY id ASC");
$stmtAll->execute([$participantId]);
$allInvoices = $stmtAll->fetchAll() ?: [];

$cicilanList = [];
$totalTagihan = 0.0;
$i = 1;

foreach ($allInvoices as $invRow) {
    $nom = (float)($invRow['nominal'] ?? 0);
    $totalTagihan += $nom;
    $cicilanList[] = [
        'ke'        => $i++,
        'deskripsi' => $invRow['keterangan'] ?? "Cicilan " . ($i - 1),
        'tanggal'   => $invRow['tanggal_tagihan'] ?: date('Y-m-d'),
        'nominal'   => $nom,
        'status'    => $invRow['status'] ?? 'Menunggu',
    ];
}

$studentName  = $participant['nama'] ?? $participant['name'] ?? 'Siswa Creativa';
$studentEmail = $participant['email'] ?? '-';
$studentPhone = $participant['phone'] ?? '-';
$studentProg  = $participant['program'] ?? 'Intensif Offline';
$studentBatch = $participant['batch'] ?? $participant['lokasi'] ?? 'Cianjur';

$partTipe = strtolower(trim((string)($participant['tipe_pembayaran'] ?? $participant['metode_pembayaran'] ?? '')));
$isCicilan = (stripos($partTipe, 'cicil') !== false || stripos($partTipe, 'dp') !== false || count($cicilanList) > 1);
$tipePembayaran = $isCicilan ? 'cicilan' : 'fullpayment';

$totalBiaya = (float)($participant['total_biaya'] ?? 0);
if ($totalBiaya <= 0) {
    $totalBiaya = $totalTagihan > 0 ? $totalTagihan : ($isCicilan ? 15000000.00 : 12000000.00);
}

// Jika tipe pembayaran Full Payment, total biaya wajib 12 Juta (12.000.000)
if (!$isCicilan) {
    if ($totalBiaya <= 0 || $totalBiaya == 15000000.00) {
        $totalBiaya = 12000000.00;
    }
    $tglJt = !empty($allInvoices[0]['tanggal_tagihan']) ? $allInvoices[0]['tanggal_tagihan'] : date('Y-m-d', strtotime('+2 days'));
    $statJt = !empty($allInvoices[0]['status']) ? $allInvoices[0]['status'] : 'Menunggu';
    $cicilanList = [
        [
            'ke'        => 1,
            'deskripsi' => 'Full Payment',
            'tanggal'   => $tglJt,
            'nominal'   => $totalBiaya,
            'status'    => $statJt,
        ]
    ];
}

// Parse parent invoice code (contoh: TGCJ26110002)
$baseInvoiceNumber = preg_replace('/-[0-9]+$/', '', $targetInvoice['nomor_invoice']);

$invData = [
    'nomor_invoice'   => $baseInvoiceNumber,
    'siswa_id'        => $participantId,
    'nama_siswa'      => $studentName,
    'email'           => $studentEmail,
    'nomor_wa'        => $studentPhone,
    'program'         => $studentProg,
    'batch'           => $studentBatch,
    'tipe_pembayaran' => $tipePembayaran,
    'total_biaya'     => $totalBiaya,
    'tanggal_invoice' => $targetInvoice['created_at'] ? substr($targetInvoice['created_at'], 0, 10) : date('Y-m-d'),
    'cicilan'         => $cicilanList,
    'items'           => [
        ['nama' => 'Biaya Pelatihan & Pendidikan ' . $studentProg, 'qty' => 1, 'harga' => $totalBiaya]
    ]
];

$invoiceHtml = generateInvoiceHTML($invData);

// ── Tambahkan Action Bar & Auto-Print ──
$actionBar = "
<style>
  @media print {
    .no-print, .cbi-action-bar { display: none !important; }
    body { background: #fff !important; padding: 0 !important; }
    .page { margin: 0 auto !important; box-shadow: none !important; border: none !important; }
  }
  body { background: #f1f5f9; padding-top: 60px; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }
  .page { background: #fff; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border-radius: 8px; margin: 20px auto; }
  .cbi-action-bar {
    position: fixed; top: 0; left: 0; right: 0; height: 56px;
    background: #0f172a; color: #fff; display: flex; align-items: center;
    justify-content: space-between; padding: 0 20px; z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .cbi-action-bar .brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px; color: #38bdf8; }
  .cbi-action-bar .actions { display: flex; align-items: center; gap: 10px; }
  .cbi-btn {
    display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px;
    border-radius: 6px; font-size: 12px; font-weight: 700; text-decoration: none;
    cursor: pointer; border: none; transition: all 0.15s ease;
  }
  .cbi-btn-back { background: #334155; color: #f8fafc; }
  .cbi-btn-back:hover { background: #475569; }
  .cbi-btn-print { background: #2563eb; color: #ffffff; }
  .cbi-btn-print:hover { background: #1d4ed8; }
</style>
<div class='cbi-action-bar'>
  <div class='brand'>
    <span>LPK Creativa Bridging International</span>
    <span style='color:#94a3b8;font-weight:400;font-size:12px;'>&bull; Lembar Tagihan Resmi</span>
  </div>
  <div class='actions'>
    <a href='/siswa/dashboard?id={$participantId}' class='cbi-btn cbi-btn-back'>&larr; Kembali ke Dashboard</a>
    <button onclick='window.print()' class='cbi-btn cbi-btn-print'>🖨️ Cetak / Unduh PDF</button>
  </div>
</div>
";

$printScript = $isPrint ? "<script>window.addEventListener('load', function() { setTimeout(function(){ window.print(); }, 400); });</script>" : "";

$output = str_replace('<body>', '<body>' . $actionBar, $invoiceHtml);
$output = str_replace('</body>', $printScript . '</body>', $output);

echo $output;

