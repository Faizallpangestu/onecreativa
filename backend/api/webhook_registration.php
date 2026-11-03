<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Webhook-Secret");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/database.php';

$EXPECTED_SECRET = 'CREATIVA_SYNC_SECRET_2026';

// 1. Health check & Documentation via GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $apiKey = $_GET['api_key'] ?? $_GET['secret'] ?? '';
    $isAuthorized = ($apiKey === $EXPECTED_SECRET);
    
    // Hitung status integrasi saat ini
    $totalPeserta = 0;
    $totalInvoices = 0;
    if ($res = mysqli_query($conn, "SELECT COUNT(*) as cnt FROM peserta_intensif WHERE source = 'creativabridging.com'")) {
        $totalPeserta = (int)(mysqli_fetch_assoc($res)['cnt'] ?? 0);
    }
    if ($res = mysqli_query($conn, "SELECT COUNT(*) as cnt FROM billing_invoices")) {
        $totalInvoices = (int)(mysqli_fetch_assoc($res)['cnt'] ?? 0);
    }

    echo json_encode([
        'status' => 'online',
        'service' => 'ONE Creativa Webhook Registration Integration',
        'layer' => 'Layer 2 (Integrasi Pendaftaran Web & Tagihan Otomatis)',
        'target_website' => 'https://creativabridging.com',
        'authorized' => $isAuthorized,
        'endpoint' => 'https://one.creativabridging.com/api/webhook_registration.php',
        'stats' => [
            'web_students_registered' => $totalPeserta,
            'total_billing_invoices' => $totalInvoices
        ],
        'usage' => [
            'method' => 'POST',
            'headers' => [
                'Content-Type' => 'application/json',
                'X-Webhook-Secret' => 'CREATIVA_SYNC_SECRET_2026'
            ],
            'sample_payload' => [
                'secret' => 'CREATIVA_SYNC_SECRET_2026',
                'student' => [
                    'id' => 101,
                    'nama' => 'Nama Peserta',
                    'phone' => '081234567890',
                    'email' => 'peserta@example.com',
                    'noKtp' => '3203010101990001',
                    'program' => 'Program Pelatihan Jepang',
                    'skema' => 'cicilan',
                    'status' => 'Pending',
                    'kota' => 'Cianjur',
                    'alamat' => 'Jl. Raya Bandung, Cianjur',
                    'batch' => 'Batch 2'
                ]
            ]
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

// 2. Autentikasi Webhook (POST)
$providedSecret = $_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? $_GET['api_key'] ?? $_GET['secret'] ?? '';

$rawInput = file_get_contents('php://input');
$body = [];
if ($rawInput) {
    $body = json_decode($rawInput, true) ?: [];
}
if (!$providedSecret && !empty($body['secret'])) {
    $providedSecret = $body['secret'];
}
if (!$providedSecret && !empty($body['api_key'])) {
    $providedSecret = $body['api_key'];
}

if ($providedSecret !== $EXPECTED_SECRET) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unauthorized: Webhook secret tidak valid atau belum disertakan.',
        'hint' => 'Sertakan header X-Webhook-Secret: CREATIVA_SYNC_SECRET_2026 atau ?api_key=CREATIVA_SYNC_SECRET_2026'
    ]);
    exit;
}

try {
    // 3. Normalisasi data siswa (mendukung single atau array students)
    $studentsToProcess = [];
    if (!empty($body['students']) && is_array($body['students'])) {
        $studentsToProcess = $body['students'];
    } elseif (!empty($body['student']) && is_array($body['student'])) {
        $studentsToProcess = [$body['student']];
    } elseif (!empty($body['nama']) || !empty($body['nama_lengkap'])) {
        $studentsToProcess = [$body];
    }

    if (empty($studentsToProcess)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Payload kosong atau tidak ada data pendaftar yang dikirim.'
        ]);
        exit;
    }

    // Pastikan seluruh kolom yang dibutuhkan peserta_intensif sudah ada (self-healing migration)
    $existingCols = [];
    if ($colRes = mysqli_query($conn, "SHOW COLUMNS FROM peserta_intensif")) {
        while ($col = mysqli_fetch_assoc($colRes)) {
            $existingCols[strtolower($col['Field'])] = true;
        }
    }
    $columnsToEnsure = [
        'web_id' => 'INT(11) DEFAULT NULL',
        'affiliator' => 'VARCHAR(100) DEFAULT NULL',
        'nis' => 'VARCHAR(50) DEFAULT NULL',
        'program' => "VARCHAR(150) DEFAULT 'Program Pelatihan Jepang'",
        'batch' => "VARCHAR(100) DEFAULT 'Batch 2'",
        'level' => "VARCHAR(50) DEFAULT 'N5'",
        'alamat' => 'TEXT DEFAULT NULL',
        'kota' => "VARCHAR(100) DEFAULT 'Kab. Cianjur'",
        'provinsi' => "VARCHAR(100) DEFAULT 'Jawa Barat'",
        'kode_pos' => "VARCHAR(20) DEFAULT '43211'",
        'negara' => "VARCHAR(50) DEFAULT 'Indonesia'",
        'source' => "VARCHAR(50) DEFAULT 'creativabridging.com'",
        'status' => "VARCHAR(50) DEFAULT 'Aktif'",
        'no_ktp' => 'VARCHAR(50) DEFAULT NULL'
    ];
    foreach ($columnsToEnsure as $colName => $colDef) {
        if (!isset($existingCols[$colName])) {
            @mysqli_query($conn, "ALTER TABLE `peserta_intensif` ADD COLUMN `$colName` $colDef");
        }
    }

    $currentYear = date('y');
    $currentMonth = date('m');
    $todayDate = date('Y-m-d');
    $dueDate = date('Y-m-d', strtotime('+14 days'));

    $results = [];
    $createdStudents = 0;
    $updatedStudents = 0;
    $createdInvoices = 0;

    foreach ($studentsToProcess as $p) {
        $name = trim($p['nama'] ?? $p['nama_lengkap'] ?? '');
        if (!$name) continue;

        $rawWebId = (int)($p['id'] ?? $p['web_id'] ?? 0);
        $phone = trim($p['phone'] ?? $p['no_wa'] ?? $p['kontak'] ?? '');
        $email = trim($p['email'] ?? '');
        $noKtp = trim($p['noKtp'] ?? $p['no_ktp'] ?? $p['nik'] ?? '');
        $program = trim($p['program'] ?? 'Program Pelatihan Jepang');
        $rawStatus = trim($p['status'] ?? 'Menunggu Pembayaran');
        $status = ($rawStatus === 'Pending' || $rawStatus === 'Pembayaran') ? 'Menunggu Pembayaran' : ($rawStatus ?: 'Aktif');
        $kota = trim($p['kotaDomisili'] ?? $p['kota'] ?? 'Cianjur');
        $lokasi = trim($p['lokasiTinggal'] ?? '');
        $alamat = trim($p['alamat'] ?? ($kota . ($lokasi ? ', ' . $lokasi : ', Jawa Barat')));
        $batch = !empty($p['batch']) ? $p['batch'] : 'Batch 2';
        $skema = strtolower(trim($p['skema'] ?? 'cicilan'));

        // Biaya Program Resmi Creativa
        $programAmount = 15000000.00;
        if (stripos($program, 'sotsugyousei') !== false) {
            $programAmount = 7500000.00;
        } elseif (stripos($program, 'reguler') !== false) {
            $programAmount = 5000000.00;
        }
        if (!empty($p['nominal']) && is_numeric($p['nominal'])) {
            $programAmount = (float)$p['nominal'];
        }

        // Generate NIS resmi LPK: TGCJ + Tahun(2 digit) + Bulan(2 digit) + ID urut
        $nis = !empty($p['nis']) ? $p['nis'] : ('TGCJ' . $currentYear . $currentMonth . str_pad($rawWebId ?: rand(100, 999), 3, '0', STR_PAD_LEFT));

        // ── A. Validasi & Cek Duplikat Peserta di peserta_intensif ──
        $existing = null;
        $stmt = $conn->prepare("SELECT id, nis, nama_lengkap, no_wa, email FROM peserta_intensif WHERE email = ? OR (nama_lengkap = ? AND no_wa = ?) OR (no_ktp != '' AND no_ktp = ?) LIMIT 1");
        $stmt->bind_param("ssss", $email, $name, $phone, $noKtp);
        $stmt->execute();
        $existing = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        $studentId = null;
        if ($existing) {
            $studentId = (int)$existing['id'];
            $nis = !empty($existing['nis']) ? $existing['nis'] : $nis;
            $updateStmt = $conn->prepare("UPDATE peserta_intensif SET no_wa=?, email=?, no_ktp=?, program=?, status=?, kota=?, alamat=?, nis=?, web_id=?, source='creativabridging.com' WHERE id=?");
            $updateStmt->bind_param("ssssssssii", $phone, $email, $noKtp, $program, $status, $kota, $alamat, $nis, $rawWebId, $studentId);
            $updateStmt->execute();
            $updateStmt->close();
            $updatedStudents++;
        } else {
            $insertStmt = $conn->prepare("INSERT INTO peserta_intensif (nama_lengkap, no_wa, email, no_ktp, program, status, kota, provinsi, negara, alamat, nis, batch, level, web_id, source) VALUES (?, ?, ?, ?, ?, ?, ?, 'Jawa Barat', 'Indonesia', ?, ?, ?, 'N5', ?, 'creativabridging.com')");
            $insertStmt->bind_param("ssssssssssi", $name, $phone, $email, $noKtp, $program, $status, $kota, $alamat, $nis, $batch, $rawWebId);
            $insertStmt->execute();
            $studentId = $conn->insert_id;
            $insertStmt->close();
            $createdStudents++;
        }

        // ── B. Cek & Auto-Generate Invoice Tagihan (billing_invoices) ──
        // Cek apakah invoice untuk pendaftar ini sudah pernah dibuat
        $existingInv = null;
        $invStmt = $conn->prepare("SELECT id, total, status FROM billing_invoices WHERE customer = ? OR id = ? LIMIT 1");
        $invStmt->bind_param("ss", $name, $nis);
        $invStmt->execute();
        $existingInv = $invStmt->get_result()->fetch_assoc();
        $invStmt->close();

        $invoiceId = null;
        $invoiceStatus = 'Unpaid';
        $invoiceCreatedNow = false;

        if ($existingInv) {
            $invoiceId = $existingInv['id'];
            $invoiceStatus = $existingInv['status'];
            $programAmount = (float)$existingInv['total'];
        } else {
            // Generate Invoice ID standar: INV-YYYYMM-XXXX
            // Ambil nomor urut invoice bulan ini
            $prefix = 'INV-' . date('Ym') . '-';
            $numRes = mysqli_query($conn, "SELECT id FROM billing_invoices WHERE id LIKE '$prefix%' ORDER BY id DESC LIMIT 1");
            $nextSeq = 1;
            if ($numRes && $row = mysqli_fetch_assoc($numRes)) {
                $lastNum = (int)substr($row['id'], -4);
                $nextSeq = $lastNum + 1;
            }
            $invoiceId = $prefix . str_pad($nextSeq, 4, '0', STR_PAD_LEFT);

            $keterangan = "Biaya Pendaftaran & Pelatihan: " . $program . " (" . ($skema === 'full' ? 'Full Payment' : 'Skema Cicilan / DP') . ")";
            
            $createInvStmt = $conn->prepare("INSERT INTO billing_invoices (id, tanggal, customer, email, phone, total, status, jatuhTempo, keterangan, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Unpaid', ?, ?, NOW())");
            $createInvStmt->bind_param("sssssdss", $invoiceId, $todayDate, $name, $email, $phone, $programAmount, $dueDate, $keterangan);
            $createInvStmt->execute();
            $createInvStmt->close();
            $createdInvoices++;
            $invoiceCreatedNow = true;

            // ── C. Auto-Log ke Riwayat Pengiriman (billing_terkirim) ──
            $kanal = ($phone && $phone !== '-') ? 'WhatsApp' : 'Email';
            $penerima = $kanal === 'WhatsApp' ? $phone : ($email ?: '-');
            $terkirimStmt = $conn->prepare("INSERT INTO billing_terkirim (id, tglKirim, customer, kanal, penerima, statusKirim, statusBaca, created_at) VALUES (?, ?, ?, ?, ?, 'Terkirim', 'Pending', NOW())");
            $terkirimStmt->bind_param("sssss", $invoiceId, $todayDate, $name, $kanal, $penerima);
            $terkirimStmt->execute();
            $terkirimStmt->close();
        }

        // ── D. Format Tautan WhatsApp Notifikasi Tagihan ──
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = '62' . substr($cleanPhone, 1);
        }
        $formattedNominal = "Rp " . number_format($programAmount, 0, ',', '.');
        $waMessage = rawurlencode(
            "Halo {$name},\n\nTerima kasih telah mendaftar di LPK Creativa Bridging International.\n\nBerikut rincian tagihan invoice Anda:\n" .
            "• No. Invoice: {$invoiceId}\n" .
            "• Program: {$program}\n" .
            "• Total Tagihan: {$formattedNominal}\n" .
            "• Jatuh Tempo: {$dueDate}\n" .
            "• Rekening Pembayaran: BCA 1832-918-428 a.n. PT CREATIVA BRIDGING INTERNATIONAL\n\n" .
            "Setelah melakukan pembayaran, mohon konfirmasi dengan mengirimkan bukti transfer. Terima kasih!\n- Finance LPK Creativa"
        );
        $waLink = $cleanPhone ? "https://api.whatsapp.com/send?phone={$cleanPhone}&text={$waMessage}" : null;

        $results[] = [
            'student_id' => $studentId,
            'nis' => $nis,
            'nama' => $name,
            'email' => $email,
            'phone' => $phone,
            'program' => $program,
            'invoice_id' => $invoiceId,
            'nominal' => $programAmount,
            'status_invoice' => $invoiceStatus,
            'jatuh_tempo' => $dueDate,
            'invoice_created_now' => $invoiceCreatedNow,
            'whatsapp_link' => $waLink
        ];
    }

    echo json_encode([
        'status' => 'success',
        'message' => "Integrasi webhook berhasil: {$createdStudents} siswa baru dibuat, {$updatedStudents} diperbarui, {$createdInvoices} invoice otomatis diterbitkan.",
        'summary' => [
            'processed' => count($results),
            'students_created' => $createdStudents,
            'students_updated' => $updatedStudents,
            'invoices_created' => $createdInvoices
        ],
        'data' => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Terjadi kesalahan sistem saat memproses webhook: ' . $e->getMessage()
    ]);
}
