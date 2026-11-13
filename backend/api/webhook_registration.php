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
require_once __DIR__ . '/../services/registration_sync.php';

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

    $pricingReviews = 0;
    $webhookActor = ['id' => 0, 'role' => 'integration', 'name' => 'Registration webhook'];
    foreach ($studentsToProcess as $p) {
        if (!is_array($p)) ac_fail('Data pendaftar tidak valid.');
        $outcome = registration_process($conn, $webhookActor, $p, 'webhook', function (array $context) use ($conn, $webhookActor, $currentYear, $currentMonth, $todayDate, $deliveryModePending, $officialIncludes, $officialExcludes, $p) {
        $student = $context['student'];
        $studentId = (int)$student['id'];
        $rawWebId = $student['web_id'] ?? null;
        $name = $student['nama_lengkap']; $email = $student['email']; $phone = $student['no_wa']; $nis = $student['nis'] ?? '';
        $program = $student['program']; $kota = $student['kota'] ?? '';
        [$existingInv, $invoiceConflict] = registration_invoice($conn, $student, $context['registration_key']);
        if ($invoiceConflict !== '') $context['pricing'] = array_replace($context['pricing'], ['status' => 'needs_review', 'reason' => $invoiceConflict]);
        if (!$existingInv && $context['pricing']['status'] !== 'approved') return $context;
        $pricing = $context['pricing'];
        $skema = $pricing['scheme'] ?? sp_scheme($student['metode_pembayaran'] ?? '');
        $metodeLabel = sp_scheme_label($skema) ?? ($student['metode_pembayaran'] ?? '');
        $programAmount = $existingInv ? ac_decimal(ac_cents($existingInv['total'])) : $pricing['amount'];
        $existingMeta = $existingInv ? (json_decode($existingInv['meta_json'] ?? '', true) ?: []) : [];
        $installments = $existingInv ? ($existingMeta['installments'] ?? []) : sp_schedule($pricing, $todayDate);
        $dueDate = $existingInv ? $existingInv['jatuhTempo'] : $installments[0]['jatuhTempo'];
        $dueNowNominal = $installments[0]['nominal'] ?? null;
        if ($existingInv && $dueNowNominal !== null) {
            try { $dueNowNominal = ac_decimal(ac_cents($dueNowNominal)); }
            catch (AccountingException $error) {
                $dueNowNominal = null;
                $context['pricing'] = array_replace($context['pricing'], ['status' => 'needs_review', 'reason' => 'legacy_installment_requires_review']);
            }
        }
        $lokasiLabel = $kota;
        $itemTitle = "{$program} ({$metodeLabel})";
        $itemSubtitle = "Biaya Pendidikan Bahasa Jepang dan Pelatihan Skill - {$lokasiLabel}";
        $metaArray = [
            'skema' => $skema,
            'program' => $program,
            'lokasi' => $lokasiLabel,
            'durasi' => '7 Bulan',
            'subtotal' => $programAmount,
            'items' => [[
                'id' => 1,
                'deskripsi' => $itemTitle,
                'subdeskripsi' => $itemSubtitle,
                'harga' => $programAmount,
                'diskon' => 0,
                'jumlah' => $programAmount,
            ]],
            'installments' => $installments,
            'includes' => $officialIncludes,
            'excludes' => $officialExcludes,
            'bank_name' => 'BCA',
            'account_number' => '1832-918-428',
            'account_holder' => 'CREATIVA BRIDGING INTERN',
            'source' => 'rpa-phase1-webhook',
            'student_id' => $studentId,
            'registration_key' => $context['registration_key'],
            'pricing' => $pricing['status'] === 'approved' ? sp_proof($pricing) : null,
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
            $programAmount = ac_decimal(ac_cents($existingInv['total']));
            $dueDate = !empty($existingInv['jatuhTempo']) ? $existingInv['jatuhTempo'] : $dueDate;
            $publicToken = trim((string)($existingInv['public_token'] ?? ''));
            // Existing invoices, including paid invoices and their tokens, stay unchanged.
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
            $createInvStmt->bind_param("ssssssssss", $invoiceId, $todayDate, $name, $email, $phone, $programAmount, $dueDate, $keterangan, $publicToken, $metaJson);
            $createInvStmt->execute();
            $createInvStmt->close();
            ac_audit($conn, $webhookActor, 'billing_invoice', $invoiceId, 'created', ['student_id' => $studentId, 'amount' => $programAmount, 'pricing' => sp_proof($pricing), 'registration_key' => $context['registration_key']]);
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
        $formattedTotal = sp_format_rupiah($programAmount);
        $formattedDueNow = $dueNowNominal !== null ? sp_format_rupiah($dueNowNominal) : 'Perlu review Finance';
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

        $context['api_result'] = [
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
            'pricing_status' => $context['pricing']['status'],
            'pricing_reason' => $context['pricing']['reason'],
        ];
        $context['invoice'] = $existingInv;
        return $context;
        });
        if ($outcome['student']) { if ($outcome['student_created']) $createdStudents++; else $updatedStudents++; }
        if ($outcome['pricing']['status'] === 'needs_review') $pricingReviews++;
        $result = $outcome['api_result'] ?? [
            'student_id' => $outcome['student']['id'] ?? null,
            'nis' => $outcome['student']['nis'] ?? '',
            'nama' => $outcome['student']['nama_lengkap'] ?? ($p['nama'] ?? $p['name'] ?? ''),
            'invoice_id' => null, 'invoice_created_now' => false, 'needs_delivery' => false,
            'nominal' => null, 'due_now_nominal' => null, 'installments' => [],
            'pricing_status' => 'needs_review', 'pricing_reason' => $outcome['pricing']['reason'],
        ];
        if ($result['invoice_created_now']) $createdInvoices++;
        $results[] = $result;
    }

    echo json_encode([
        'status' => 'success',
        'message' => "Integrasi webhook berhasil: {$createdStudents} siswa baru dibuat, {$updatedStudents} diperbarui, {$createdInvoices} invoice otomatis diterbitkan.",
        'summary' => [
            'processed' => count($results),
            'students_created' => $createdStudents,
            'students_updated' => $updatedStudents,
            'invoices_created' => $createdInvoices,
            'pricing_needs_review' => $pricingReviews
        ],
        'data' => $results
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    http_response_code($e instanceof AccountingException ? $e->getCode() : 500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Terjadi kesalahan sistem saat memproses webhook: ' . $e->getMessage()
    ]);
}
