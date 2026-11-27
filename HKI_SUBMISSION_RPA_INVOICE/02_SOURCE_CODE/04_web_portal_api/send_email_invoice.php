<?php
/**
 * send_email_invoice.php
 * Kirim email dengan 2 lampiran PDF: Invoice + Syarat & Ketentuan
 * 
 * POST body (JSON):
 * {
 *   "to_email": "siswa@gmail.com",
 *   "to_name": "Nama Siswa",
 *   "nomor_invoice": "INV/CBI/2024/001",
 *   "siswa_id": 1,
 *   "subject": "Invoice Program ...",
 *   "invoice_html": "<html>...",      // HTML invoice langsung dari invoice_generator
 *   "include_syarat": true,           // lampirkan Syarat & Ketentuan
 *   "tipe_pembayaran": "fullpayment", // atau cicilan
 *   "total_biaya": 12000000,
 *   "jatuh_tempo": "2024-07-01"
 * }
 */

require_once 'config.php';
require_once 'database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['to_email'])) {
    http_response_code(400);
    echo json_encode(['error' => 'to_email diperlukan']);
    exit;
}

// ─── Konfigurasi Email Pengirim ─────────────────────────────────────────────────
define('FROM_NAME',     'Finance LPK Creativa Bridging');
define('FROM_EMAIL',    'finance@creativabridging.com');

// ─── Syarat & Ketentuan HTML ──────────────────────────────────────────────────
function getSyaratKetentuan() {
    return '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;font-size:9.5pt;color:#222;padding:20mm 18mm;}
h1{font-size:13pt;color:#1a237e;text-align:center;border-bottom:2px solid #1a237e;padding-bottom:8px;}
h2{font-size:10.5pt;color:#1a237e;margin-top:14px;}
ul{margin:6px 0;padding-left:18px;}
li{margin-bottom:4px;}
.header{text-align:center;margin-bottom:16px;}
.company{font-size:14pt;font-weight:bold;color:#1a237e;}
</style></head>
<body>
<div class="header">
  <p class="company">LPK CREATIVA BRIDGING INTERNATIONAL</p>
  <p style="margin:2px 0;font-size:9pt;color:#555;">Jl. Raya Karang Tengah No.99, Cianjur, Jawa Barat 43212 | creativabridging.com</p>
</div>

<h1>SYARAT DAN KETENTUAN UMUM<br>LPK CREATIVA BRIDGING INTERNATIONAL</h1>

<h2>A. KETENTUAN PENDAFTARAN</h2>
<ul>
  <li>Calon peserta wajib mengisi formulir pendaftaran dengan data yang benar dan lengkap.</li>
  <li>Pendaftaran dianggap sah setelah melakukan pembayaran sesuai ketentuan yang berlaku.</li>
  <li>LPK Creativa Bridging International berhak menolak pendaftaran apabila peserta tidak memenuhi persyaratan.</li>
  <li>Biaya pendaftaran yang telah dibayarkan tidak dapat dikembalikan (non-refundable) kecuali dalam kondisi tertentu sesuai kebijakan LPK.</li>
</ul>

<h2>B. KETENTUAN PEMBAYARAN</h2>
<ul>
  <li>Pembayaran dapat dilakukan secara <strong>Full Payment</strong> atau <strong>Cicilan</strong> sesuai kesepakatan.</li>
  <li>Pembayaran melalui transfer bank ke rekening resmi LPK Creativa Bridging International.</li>
  <li>Peserta wajib mengirimkan bukti pembayaran ke WhatsApp: <strong>+62 815-2222-672</strong> atau email: <strong>info@creativabridging.com</strong>.</li>
  <li>Keterlambatan pembayaran cicilan lebih dari 7 hari dapat mengakibatkan penundaan atau penghentian program.</li>
  <li>LPK tidak bertanggung jawab atas pembayaran yang dilakukan ke rekening yang bukan merupakan rekening resmi LPK.</li>
</ul>

<h2>C. KETENTUAN PROGRAM & PELATIHAN</h2>
<ul>
  <li>Peserta wajib mengikuti seluruh jadwal pelatihan yang telah ditentukan oleh LPK.</li>
  <li>Ketidakhadiran lebih dari 3 kali tanpa keterangan dapat mengakibatkan pencabutan status peserta.</li>
  <li>Materi pelatihan, modul, dan bahan ajar merupakan hak kekayaan intelektual LPK dan tidak boleh disebarluaskan.</li>
  <li>LPK berhak mengubah jadwal, instruktur, atau metode pelatihan dengan pemberitahuan sebelumnya.</li>
</ul>

<h2>D. KETENTUAN KEBERANGKATAN KE JEPANG</h2>
<ul>
  <li>Keberangkatan ke Jepang bergantung pada ketersediaan lowongan kerja dari mitra perusahaan di Jepang.</li>
  <li>LPK tidak memberikan jaminan keberangkatan dalam jangka waktu tertentu.</li>
  <li>Peserta wajib lulus seleksi dan interview dari perusahaan Jepang yang bersangkutan.</li>
  <li>Dokumen perjalanan (paspor, visa, COE) menjadi tanggung jawab peserta dengan bimbingan LPK.</li>
  <li>Biaya-biaya di luar program pelatihan (visa, paspor, medical check-up, dll) ditanggung oleh peserta.</li>
</ul>

<h2>E. KETENTUAN PEMBATALAN & PENGUNDURAN DIRI</h2>
<ul>
  <li>Peserta yang mengundurkan diri setelah pembayaran dilakukan tidak mendapat pengembalian biaya (refund).</li>
  <li>Peserta dapat mengajukan penangguhan (bukan pembatalan) dengan kondisi tertentu yang disetujui oleh LPK.</li>
  <li>LPK berhak membatalkan keikutsertaan peserta yang melanggar tata tertib tanpa pengembalian biaya.</li>
</ul>

<h2>F. KETENTUAN LAIN-LAIN</h2>
<ul>
  <li>Segala sengketa yang timbul diselesaikan secara musyawarah mufakat.</li>
  <li>Apabila tidak tercapai kesepakatan, para pihak setuju untuk menyelesaikan melalui jalur hukum yang berlaku di Indonesia.</li>
  <li>Dengan melakukan pembayaran/pendaftaran, peserta dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan ini.</li>
</ul>

<div style="margin-top:24px;border-top:1px solid #ddd;padding-top:12px;font-size:9pt;color:#555;text-align:center;">
  Dokumen ini berlaku sejak tanggal pendaftaran. | LPK Creativa Bridging International © ' . date('Y') . '
</div>
</body>
</html>';
}

// ─── Convert HTML ke binary PDF-like string via base64 inline content ─────────
// (Karena tidak ada Dompdf, kita kirim HTML sebagai attachment .html dan
//  server bisa diupgrade dengan Dompdf nanti)
// Untuk production, install Dompdf: composer require dompdf/dompdf

function htmlToAttachment($html, $filename) {
    // Jika Dompdf tersedia
    $dompdfPath = __DIR__ . '/../../vendor/autoload.php';
    if (file_exists($dompdfPath)) {
        require_once $dompdfPath;
        $dompdf = new \Dompdf\Dompdf(['enable_remote' => true, 'enable_html5_parser' => true]);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();
        return [
            'content'   => $dompdf->output(),
            'mime'      => 'application/pdf',
            'filename'  => str_replace('.html', '.pdf', $filename),
        ];
    }

    // Fallback: kirim sebagai HTML attachment
    return [
        'content'  => $html,
        'mime'     => 'text/html',
        'filename' => $filename,
    ];
}

// ─── Kirim Email via PHP mail() dengan attachment ─────────────────────────────
function sendEmailWithAttachments($to, $toName, $subject, $bodyHtml, $attachments = []) {
    $boundary = 'boundary_' . md5(uniqid());
    $fromLine = "From: " . FROM_NAME . " <" . FROM_EMAIL . ">\r\n";

    $headers  = $fromLine;
    $headers .= "Reply-To: " . FROM_EMAIL . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n";

    $body  = "--{$boundary}\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $body .= $bodyHtml . "\r\n";

    foreach ($attachments as $att) {
        $encoded = chunk_split(base64_encode($att['content']));
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Type: {$att['mime']}; name=\"{$att['filename']}\"\r\n";
        $body .= "Content-Disposition: attachment; filename=\"{$att['filename']}\"\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $body .= $encoded . "\r\n";
    }

    $body .= "--{$boundary}--";

    $toHeader = $toName ? "{$toName} <{$to}>" : $to;
    $result   = mail($toHeader, $subject, $body, $headers);

    return $result;
}

// ─── Template Email Body (HTML) ───────────────────────────────────────────────
function getEmailBody($data) {
    $tipe  = strtolower($data['tipe_pembayaran'] ?? 'fullpayment');
    $label = $tipe === 'cicilan' ? 'Cicilan / DP' : 'Full Payment';
    $jt    = !empty($data['jatuh_tempo']) ? date('d/m/Y', strtotime($data['jatuh_tempo'])) : '-';

    return "<!DOCTYPE html>
<html>
<head><meta charset='UTF-8'></head>
<body style='font-family:Arial,sans-serif;color:#222;max-width:600px;margin:0 auto;'>
  <div style='background:#1a237e;padding:20px 30px;'>
    <p style='color:white;font-size:16pt;font-weight:bold;margin:0;'>LPK Creativa Bridging International</p>
    <p style='color:#90caf9;margin:4px 0 0;font-size:9pt;'>creativabridging.com</p>
  </div>
  <div style='padding:24px 30px;border:1px solid #ddd;'>
    <p>Kepada Yth.<br><strong>" . htmlspecialchars($data['to_name']) . "</strong></p>
    <p>Terima kasih telah mendaftar di <strong>LPK Creativa Bridging International</strong>.<br>
    Bersama email ini kami lampirkan dokumen berikut:</p>
    <ul>
      <li>📄 <strong>Invoice " . htmlspecialchars($data['nomor_invoice'] ?? '') . "</strong> — " . $label . "</li>
      <li>📋 <strong>Syarat & Ketentuan</strong> LPK Creativa Bridging International</li>
    </ul>
    <div style='background:#e8eaf6;border-radius:8px;padding:14px 18px;margin:16px 0;'>
      <p style='margin:0;font-size:10pt;'>
        <strong>No. Invoice:</strong> " . htmlspecialchars($data['nomor_invoice'] ?? '-') . "<br>
        <strong>Tipe Pembayaran:</strong> " . strtoupper($label) . "<br>
        <strong>Jatuh Tempo:</strong> " . $jt . "
      </p>
    </div>
    <p style='font-size:9.5pt;'>
      Mohon lakukan pembayaran sebelum tanggal jatuh tempo dan kirimkan bukti transfer ke:<br>
      📱 WhatsApp: <strong>+62 815-2222-672</strong><br>
      ✉ Email: <strong>info@creativabridging.com</strong>
    </p>
    <p style='font-size:9.5pt;margin-top:16px;'>
      Jika ada pertanyaan, silakan hubungi kami. Kami siap membantu perjalanan Anda ke Jepang! 🇯🇵
    </p>
    <p style='margin-top:24px;'>Salam,<br><strong>Tim Finance<br>LPK Creativa Bridging International</strong></p>
  </div>
  <div style='background:#f5f5f5;padding:12px 30px;font-size:8.5pt;color:#777;text-align:center;'>
    © " . date('Y') . " LPK Creativa Bridging International — Jl. Raya Karang Tengah No.99, Cianjur
  </div>
</body>
</html>";
}

// ─── Main Logic ───────────────────────────────────────────────────────────────
try {
    $pdo = getDbConnection();

    $toEmail     = $input['to_email'];
    $toName      = $input['to_name'] ?? '';
    $nomorInv    = $input['nomor_invoice'] ?? 'N/A';
    $tipe        = strtolower($input['tipe_pembayaran'] ?? 'fullpayment');
    $invoiceHtml = $input['invoice_html'] ?? '';

    // Jika invoice_html tidak dikirim, ambil dari file
    if (empty($invoiceHtml) && !empty($input['invoice_url'])) {
        $filepath = __DIR__ . '/../' . ltrim($input['invoice_url'], '/');
        if (file_exists($filepath)) {
            $invoiceHtml = file_get_contents($filepath);
        }
    }

    if (empty($invoiceHtml)) {
        throw new Exception('invoice_html diperlukan (kirim dari invoice_generator atau invoice_url)');
    }

    $subject  = $input['subject'] ?? "Invoice {$nomorInv} — LPK Creativa Bridging International";
    $bodyHtml = getEmailBody(array_merge($input, ['to_name' => $toName]));

    // Buat attachment invoice
    $invFilename = 'INVOICE-' . preg_replace('/[^a-zA-Z0-9\-]/', '-', $nomorInv) . '-' 
                 . preg_replace('/\s+/', '-', strtoupper($toName)) . '.html';
    $attachments = [htmlToAttachment($invoiceHtml, $invFilename)];

    // Lampirkan Syarat & Ketentuan jika diminta
    if (!empty($input['include_syarat'])) {
        $syaratHtml     = getSyaratKetentuan();
        $attachments[]  = htmlToAttachment($syaratHtml, 'Syarat-Ketentuan-LPK-Creativa.html');
    }

    // Kirim email
    $sent = sendEmailWithAttachments($toEmail, $toName, $subject, $bodyHtml, $attachments);

    // Log pengiriman ke invoice_sent_log
    $pdo->exec("CREATE TABLE IF NOT EXISTS invoice_sent_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nomor_invoice VARCHAR(50),
        siswa_id INT DEFAULT 0,
        tanggal_kirim DATETIME DEFAULT CURRENT_TIMESTAMP,
        kanal ENUM('Email','WhatsApp','Keduanya') DEFAULT 'Email',
        penerima VARCHAR(255),
        status_kirim ENUM('Terkirim','Gagal','Pending') DEFAULT 'Pending',
        status_baca ENUM('Dibaca','Belum Dibaca') DEFAULT 'Belum Dibaca',
        pesan_error TEXT DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $stmtLog = $pdo->prepare("
        INSERT INTO invoice_sent_log (nomor_invoice, siswa_id, kanal, penerima, status_kirim)
        VALUES (?, ?, 'Email', ?, ?)
    ");
    $stmtLog->execute([
        $nomorInv,
        $input['siswa_id'] ?? 0,
        $toEmail,
        $sent ? 'Terkirim' : 'Gagal',
    ]);

    echo json_encode([
        'success'        => $sent,
        'nomor_invoice'  => $nomorInv,
        'to_email'       => $toEmail,
        'attachments'    => count($attachments),
        'message'        => $sent ? 'Email berhasil dikirim dengan lampiran' : 'Gagal mengirim email',
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
