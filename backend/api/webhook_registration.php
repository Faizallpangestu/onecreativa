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
require_once __DIR__ . '/../services/rpa_automation.php';

$EXPECTED_SECRET = rpa_get_secret();

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
        'metode_pembayaran' => 'VARCHAR(100) DEFAULT NULL',
        'total_biaya' => 'DECIMAL(15,2) DEFAULT NULL',
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

    // Pastikan kolom meta_json & public_token ada pada billing_invoices
    foreach (['public_token' => 'VARCHAR(64) NULL', 'meta_json' => 'LONGTEXT NULL'] as $bCol => $bDef) {
        $chkB = @mysqli_query($conn, "SHOW COLUMNS FROM `billing_invoices` LIKE '{$bCol}'");
        if ($chkB && mysqli_num_rows($chkB) === 0) {
            @mysqli_query($conn, "ALTER TABLE `billing_invoices` ADD COLUMN `{$bCol}` {$bDef}");
        }
    }

    $currentYear = date('y');
    $currentMonth = date('m');
    $todayDate = date('Y-m-d');
    $baseDueDate = date('Y-m-d', strtotime('+2 days'));
    $deliveryModePending = !empty($body['defer_delivery_log']);

    $officialIncludes = [
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
    $officialExcludes = [
        'Biaya Utilitas (Air, Listrik, Internet, & IPL Asrama per Bulan)',
        'Biaya Makan',
        'Keperluan Pribadi Lainnya',
    ];

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
        $program = trim($p['program'] ?? $p['programMinat'] ?? 'Intensif Offline');
        $rawStatus = trim($p['status'] ?? 'Menunggu Pembayaran');
        $status = ($rawStatus === 'Pending' || $rawStatus === 'Pembayaran') ? 'Menunggu Pembayaran' : ($rawStatus ?: 'Aktif');
        $kota = trim($p['kotaDomisili'] ?? $p['kota'] ?? 'Cianjur');
        $lokasi = trim($p['lokasiTinggal'] ?? '');
        $alamat = trim($p['alamat'] ?? ($kota . ($lokasi ? ', ' . $lokasi : ', Jawa Barat')));
        $batch = !empty($p['batch']) ? $p['batch'] : 'Batch 2';
        $metodeRaw = trim((string)($p['metodePembayaran'] ?? $p['metode_pembayaran'] ?? $p['tipe_pembayaran'] ?? $p['skema'] ?? 'Full Payment'));
        $skema = (stripos($metodeRaw, 'cicil') !== false || stripos($metodeRaw, 'dp') !== false) ? 'cicilan' : 'full';
        $metodeLabel = $skema === 'cicilan' ? 'Cicilan' : 'Full Payment';

        // Biaya Program Resmi Creativa
        $programAmount = $skema === 'cicilan' ? 18000000.00 : 15000000.00;
        if (stripos($program, 'kaigo') !== false || stripos($program, 'talang') !== false) {
            $programAmount = 17760000.00;
        } elseif (stripos($program, 'sotsugyousei') !== false) {
            $programAmount = 7500000.00;
        } elseif (stripos($program, 'reguler') !== false) {
            $programAmount = 5000000.00;
        }
        if (!empty($p['nominal']) && is_numeric($p['nominal'])) {
            $programAmount = (float)$p['nominal'];
        } elseif (!empty($p['total_biaya']) && is_numeric($p['total_biaya']) && (float)$p['total_biaya'] > 0) {
            $programAmount = (float)$p['total_biaya'];
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
            $updateStmt = $conn->prepare("UPDATE peserta_intensif SET no_wa=?, email=?, no_ktp=?, program=?, metode_pembayaran=?, total_biaya=?, status=?, kota=?, alamat=?, nis=?, web_id=?, source='creativabridging.com' WHERE id=?");
            $updateStmt->bind_param("sssssdssssii", $phone, $email, $noKtp, $program, $metodeLabel, $programAmount, $status, $kota, $alamat, $nis, $rawWebId, $studentId);
            $updateStmt->execute();
            $updateStmt->close();
            $updatedStudents++;
        } else {
            $insertStmt = $conn->prepare("INSERT INTO peserta_intensif (nama_lengkap, no_wa, email, no_ktp, program, metode_pembayaran, total_biaya, status, kota, provinsi, negara, alamat, nis, batch, level, web_id, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Jawa Barat', 'Indonesia', ?, ?, ?, 'N5', ?, 'creativabridging.com')");
            $insertStmt->bind_param("ssssssdsssssi", $name, $phone, $email, $noKtp, $program, $metodeLabel, $programAmount, $status, $kota, $alamat, $nis, $batch, $rawWebId);
            $insertStmt->execute();
            $studentId = $conn->insert_id;
            $insertStmt->close();
            $createdStudents++;
        }

        // ── B. Cek & Auto-Generate Invoice Tagihan (billing_invoices) ──
        // Cek apakah invoice untuk pendaftar + program ini sudah pernah dibuat (idempotency)
        $existingInv = null;
        $progKeyword = stripos($program, 'kaigo') !== false ? 'Kaigo' : (stripos($program, 'matching') !== false ? 'Matching' : (stripos($program, 'sotsug') !== false ? 'Sotsug' : 'Intensif'));
        $likeProg = '%' . $progKeyword . '%';
        $invStmt = $conn->prepare("SELECT id, total, status, jatuhTempo, public_token, meta_json FROM billing_invoices WHERE (id = ? OR (email != '' AND email = ? AND keterangan LIKE ?) OR (customer = ? AND keterangan LIKE ?)) LIMIT 1");
        $invStmt->bind_param("sssss", $nis, $email, $likeProg, $name, $likeProg);
        $invStmt->execute();
        $existingInv = $invStmt->get_result()->fetch_assoc();
        $invStmt->close();

        // Susun item & termin cicilan resmi sesuai program & metode pembayaran
        $lokasiLabel = trim((string)($kota ?: 'Cianjur'));
        $itemTitle = "{$program} ({$metodeLabel})";
        $itemSubtitle = "Biaya Pendidikan Bahasa Jepang dan Pelatihan Skill - {$lokasiLabel}";
        $installments = [];
        if ($skema === 'cicilan') {
            if (abs($programAmount - 18000000.00) < 1) {
                $presetCicilan = [5000000, 4000000, 3000000, 2000000, 2000000, 2000000];
                foreach ($presetCicilan as $cIdx => $cAmt) {
                    $installments[] = [
                        'id' => $cIdx + 1,
                        'deskripsi' => $cIdx === 0 ? 'DP Pendaftaran' : 'Cicilan ' . ($cIdx + 1),
                        'keterangan' => $cIdx === 0 ? 'DP PENDAFTARAN' : 'CICILAN KE-' . ($cIdx + 1),
                        'jatuhTempo' => date('Y-m-d', strtotime("+2 days +{$cIdx} month")),
                        'nominal' => $cAmt,
                    ];
                }
            } else {
                $dp = (int)round($programAmount * 0.4);
                $c2 = (int)round($programAmount * 0.3);
                $c3 = max(0, (int)round($programAmount) - $dp - $c2);
                foreach ([[ 'DP PENDAFTARAN', $dp ], [ 'CICILAN KE-2', $c2 ], [ 'CICILAN KE-3', $c3 ]] as $cIdx => $pair) {
                    $installments[] = [
                        'id' => $cIdx + 1,
                        'deskripsi' => $pair[0],
                        'keterangan' => $pair[0],
                        'jatuhTempo' => date('Y-m-d', strtotime("+2 days +{$cIdx} month")),
                        'nominal' => $pair[1],
                    ];
                }
            }
        } else {
            $installments[] = [
                'id' => 1,
                'deskripsi' => 'FULL PAYMENT',
                'keterangan' => 'FULL PAYMENT',
                'jatuhTempo' => $baseDueDate,
                'nominal' => (float)$programAmount,
            ];
        }

        $dueDate = $installments[0]['jatuhTempo'] ?? $baseDueDate;
        $dueNowNominal = (float)($installments[0]['nominal'] ?? $programAmount);
        $metaArray = [
            'skema' => $skema,
            'program' => $program,
            'lokasi' => $lokasiLabel,
            'durasi' => '7 Bulan',
            'subtotal' => (float)$programAmount,
            'items' => [[
                'id' => 1,
                'deskripsi' => $itemTitle,
                'subdeskripsi' => $itemSubtitle,
                'harga' => (float)$programAmount,
                'diskon' => 0,
                'jumlah' => (float)$programAmount,
            ]],
            'installments' => $installments,
            'includes' => $officialIncludes,
            'excludes' => $officialExcludes,
            'bank_name' => 'BCA',
            'account_number' => '1832-918-428',
            'account_holder' => 'CREATIVA BRIDGING INTERN',
            'source' => 'rpa-phase1-webhook',
            'web_id' => $rawWebId,
            'screening' => $p['screening'] ?? null,
        ];

        $invoiceId = null;
        $invoiceStatus = 'Unpaid';
        $invoiceCreatedNow = false;
        $publicToken = '';
        $deliveryStatus = $deliveryModePending ? 'Menunggu Bot' : 'Terkirim';

        if ($existingInv) {
            $invoiceId = $existingInv['id'];
            $invoiceStatus = $existingInv['status'];
            $programAmount = (float)$existingInv['total'];
            $dueDate = !empty($existingInv['jatuhTempo']) ? $existingInv['jatuhTempo'] : $dueDate;
            $publicToken = trim((string)($existingInv['public_token'] ?? ''));
            if ($publicToken === '') {
                $publicToken = bin2hex(random_bytes(16));
                $tokStmt = $conn->prepare("UPDATE billing_invoices SET public_token = ? WHERE id = ?");
                $tokStmt->bind_param("ss", $publicToken, $invoiceId);
                $tokStmt->execute();
                $tokStmt->close();
            }
            if (!empty($existingInv['meta_json'])) {
                $decodedExistingMeta = json_decode((string)$existingInv['meta_json'], true);
                if (is_array($decodedExistingMeta) && !empty($decodedExistingMeta['installments'])) {
                    $installments = $decodedExistingMeta['installments'];
                    $dueNowNominal = (float)($installments[0]['nominal'] ?? $programAmount);
                }
            }
            // Cek apakah antrean pengiriman bot masih berstatus 'Menunggu Bot' atau belum ada log terkirim
            $delivStmt = $conn->prepare("SELECT statusKirim FROM billing_terkirim WHERE id = ? ORDER BY created_at DESC LIMIT 1");
            if ($delivStmt) {
                $delivStmt->bind_param("s", $invoiceId);
                $delivStmt->execute();
                $delivRow = $delivStmt->get_result()->fetch_assoc();
                $delivStmt->close();
                $deliveryStatus = $delivRow ? trim((string)($delivRow['statusKirim'] ?? 'Terkirim')) : 'Menunggu Bot';
            }
        } else {
            // Generate Invoice ID resmi LPK: TGCJ + YYMM + 4 digit urut
            $prefix = 'TGCJ' . $currentYear . $currentMonth;
            $numRes = mysqli_query($conn, "SELECT id FROM billing_invoices WHERE id LIKE '{$prefix}%' ORDER BY id DESC LIMIT 1");
            $nextSeq = 1;
            if ($numRes && $row = mysqli_fetch_assoc($numRes)) {
                $tail = substr((string)$row['id'], strlen($prefix));
                if (ctype_digit($tail)) {
                    $nextSeq = (int)$tail + 1;
                }
            }
            $invoiceId = $prefix . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);
            $publicToken = bin2hex(random_bytes(16));
            $metaJson = json_encode($metaArray, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $keterangan = "{$program} ({$metodeLabel})";

            $createInvStmt = $conn->prepare("INSERT INTO billing_invoices (id, tanggal, customer, email, phone, total, status, jatuhTempo, keterangan, public_token, meta_json, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Unpaid', ?, ?, ?, ?, NOW())");
            $createInvStmt->bind_param("sssssdssss", $invoiceId, $todayDate, $name, $email, $phone, $programAmount, $dueDate, $keterangan, $publicToken, $metaJson);
            $createInvStmt->execute();
            $createInvStmt->close();
            $createdInvoices++;
            $invoiceCreatedNow = true;

            // ── C. Auto-Log ke Riwayat Pengiriman (billing_terkirim) ──
            $kanal = ($phone && $phone !== '-') ? 'WhatsApp' : 'Email';
            $penerima = $kanal === 'WhatsApp' ? $phone : ($email ?: '-');
            $initDeliveryStatus = $deliveryModePending ? 'Menunggu Bot' : 'Terkirim';
            $deliveryStatus = $initDeliveryStatus;
            $terkirimStmt = $conn->prepare("INSERT INTO billing_terkirim (id, tglKirim, customer, kanal, penerima, statusKirim, statusBaca, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW())");
            $terkirimStmt->bind_param("ssssss", $invoiceId, $todayDate, $name, $kanal, $penerima, $initDeliveryStatus);
            $terkirimStmt->execute();
            $terkirimStmt->close();
        }

        $needsDelivery = !$deliveryModePending && (
            $invoiceCreatedNow ||
            strtolower(trim($deliveryStatus)) === 'menunggu bot'
        );

        $urls = rpa_build_public_urls($invoiceId, $publicToken);
        $invoiceDocUrl = $urls['invoice_url'];
        $pdfRenderUrl  = $urls['pdf_render_url'];
        $statusPortalUrl = $urls['status_url'];

        // ── D. Format Pesan WhatsApp & Email Otomatis untuk n8n & Fallback ──
        $cleanPhone = rpa_format_wa_phone($phone);
        $formattedTotal = "Rp " . number_format($programAmount, 0, ',', '.');
        $formattedDueNow = "Rp " . number_format($dueNowNominal, 0, ',', '.');
        $plainWaMessage =
            "Halo *{$name}*,\n\n" .
            "Terima kasih telah mendaftar di *LPK Creativa Bridging International*.\n" .
            "Berikut rincian invoice resmi Anda:\n\n" .
            "• No. Invoice: *{$invoiceId}*\n" .
            "• Program: *{$program}*\n" .
            "• Skema: *{$metodeLabel}*\n" .
            "• Tagihan Awal (" . ($skema === 'cicilan' ? 'DP / Termin 1' : 'Full Payment') . "): *{$formattedDueNow}*\n" .
            "• Total Biaya Program: *{$formattedTotal}*\n" .
            "• Jatuh Tempo: *{$dueDate}*\n" .
            "• Rekening Resmi: *Bank BCA 1832-918-428* a.n. *CREATIVA BRIDGING INTERN*\n\n" .
            "Lihat / Cetak Invoice Resmi:\n{$invoiceDocUrl}\n\n" .
            "Pantau Status Pendaftaran & Unduh Receipt:\n{$statusPortalUrl}\n\n" .
            "Mohon cantumkan No. Invoice *{$invoiceId}* pada berita transfer dan kirimkan bukti transfer ke finance@creativabridging.com atau WA Finance +62 815-2222-672.\n" .
            "Terima kasih! 🙏";
        $waLink = $cleanPhone ? "https://api.whatsapp.com/send?phone={$cleanPhone}&text=" . rawurlencode($plainWaMessage) : null;

        $emailSubject = "Invoice Pendaftaran Resmi #{$invoiceId} - {$name} ({$program})";
        $emailHtml = "<div style='font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.6;max-width:620px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;padding:24px;'>"
            . "<h2 style='color:#163660;margin-top:0;'>Invoice Resmi LPK Creativa Bridging International</h2>"
            . "<p>Halo <strong>" . htmlspecialchars($name) . "</strong>,</p>"
            . "<p>Pendaftaran Anda untuk program <strong>" . htmlspecialchars($program) . "</strong> telah kami terima. Terlampir / tercantum tautan invoice tagihan resmi Anda:</p>"
            . "<table cellpadding='6' cellspacing='0' style='width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;margin:14px 0;'>"
            . "<tr><td><strong>Nomor Invoice</strong></td><td>" . htmlspecialchars($invoiceId) . "</td></tr>"
            . "<tr><td><strong>Metode Pembayaran</strong></td><td>" . htmlspecialchars($metodeLabel) . "</td></tr>"
            . "<tr><td><strong>Tagihan Jatuh Tempo (" . htmlspecialchars($dueDate) . ")</strong></td><td><strong>" . htmlspecialchars($formattedDueNow) . "</strong></td></tr>"
            . "<tr><td><strong>Total Biaya Program</strong></td><td>" . htmlspecialchars($formattedTotal) . "</td></tr>"
            . "<tr><td><strong>Rekening Tujuan</strong></td><td>Bank BCA <strong>1832-918-428</strong> a/n <strong>CREATIVA BRIDGING INTERN</strong></td></tr>"
            . "</table>"
            . "<p style='margin:18px 0;display:flex;gap:10px;flex-wrap:wrap;'>"
            . "<a href='" . htmlspecialchars($invoiceDocUrl) . "' style='background:#163660;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin-right:8px;'>Lihat &amp; Unduh Invoice Resmi</a>"
            . "<a href='" . htmlspecialchars($statusPortalUrl) . "' style='background:#047857;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;'>Pantau Status Pendaftaran</a>"
            . "</p>"
            . "<p style='font-size:12px;color:#64748b;'>Cantumkan Nomor Invoice pada berita transfer dan kirim bukti transfer ke finance@creativabridging.com atau WA +62 815-2222-672.</p>"
            . "</div>";

        $results[] = [
            'student_id' => $studentId,
            'nis' => $nis,
            'nama' => $name,
            'email' => $email,
            'phone' => $phone,
            'whatsapp_phone' => $cleanPhone,
            'program' => $program,
            'skema' => $skema,
            'metode_pembayaran' => $metodeLabel,
            'invoice_id' => $invoiceId,
            'public_token' => $publicToken,
            'invoice_url' => $invoiceDocUrl,
            'pdf_render_url' => $pdfRenderUrl,
            'status_url' => $statusPortalUrl,
            'nominal' => $programAmount,
            'due_now_nominal' => $dueNowNominal,
            'status_invoice' => $invoiceStatus,
            'jatuh_tempo' => $dueDate,
            'installments' => $installments,
            'bank' => [
                'bank_name' => 'BCA',
                'account_number' => '1832-918-428',
                'account_holder' => 'CREATIVA BRIDGING INTERN',
            ],
            'invoice_created_now' => $invoiceCreatedNow,
            'needs_delivery' => $needsDelivery,
            'delivery_status' => $deliveryStatus,
            'whatsapp_link' => $waLink,
            'whatsapp_message' => $plainWaMessage,
            'email_subject' => $emailSubject,
            'email_html' => $emailHtml,
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
