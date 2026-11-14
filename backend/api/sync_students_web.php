<?php
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/api_session_guard.php';
require_once __DIR__ . '/../services/rpa_automation.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Metode permintaan tidak didukung.']);
        exit;
    }

    $secretHeader = trim((string)($_SERVER['HTTP_X_WEBHOOK_SECRET'] ?? $_GET['secret'] ?? ''));
    if ($secretHeader === '' || !hash_equals(rpa_get_secret(), $secretHeader)) {
        api_session_guard($conn, 'prepare');
    }

    $fetchJson = function (string $url) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_USERAGENT => 'OneCreativa/2.0 (Sync)',
        ]);
        $res = curl_exec($ch);
        $err = curl_error($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($res === false || $status < 200 || $status >= 300) {
            return ['ok' => false, 'error' => $err ?: ('HTTP ' . $status), 'data' => null];
        }
        $decoded = json_decode($res, true);
        if (!is_array($decoded)) {
            return ['ok' => false, 'error' => 'Respons bukan JSON valid', 'data' => null];
        }
        return ['ok' => true, 'error' => '', 'data' => $decoded];
    };

    // 1. Prioritaskan endpoint lengkap (participants) yang memuat program, metode pembayaran, total_biaya & details
    $remoteData = null;
    $primaryRes = $fetchJson("https://creativabridging.com/api/index.php?table=participants");
    if ($primaryRes['ok']) {
        if (isset($primaryRes['data']['data']) && is_array($primaryRes['data']['data'])) {
            $remoteData = $primaryRes['data']['data'];
        } elseif (array_is_list($primaryRes['data'])) {
            $remoteData = $primaryRes['data'];
        }
    }

    // 2. Fallback ke api_peserta.php jika endpoint utama gagal
    if (!is_array($remoteData)) {
        $fallbackRes = $fetchJson("https://creativabridging.com/api_peserta.php?api_key=CREATIVA_SYNC_SECRET_2026");
        if (!$fallbackRes['ok'] || !isset($fallbackRes['data']['data']) || !is_array($fallbackRes['data']['data'])) {
            error_log('Student sync upstream request failed: ' . ($primaryRes['error'] ?: $fallbackRes['error']));
            throw new RuntimeException('Data siswa dari web pendaftaran gagal diambil. Silakan coba lagi.');
        }
        $remoteData = $fallbackRes['data']['data'];
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
            mysqli_query($conn, "ALTER TABLE `peserta_intensif` ADD COLUMN `$colName` $colDef");
        }
    }

    $inserted = 0;
    $updated = 0;
    $createdInvoices = 0;
    rpa_ensure_billing_columns($conn);
    rpa_ensure_automation_logs_table($conn);
    rpa_ensure_processed_table($conn);

    foreach ($remoteData as $p) {
        if (!is_array($p)) continue;

        $details = [];
        if (!empty($p['details'])) {
            if (is_array($p['details'])) {
                $details = $p['details'];
            } elseif (is_string($p['details'])) {
                $parsedDet = json_decode($p['details'], true);
                if (is_array($parsedDet)) $details = $parsedDet;
            }
        }

        $name = trim((string)($p['nama'] ?? $p['name'] ?? $p['namaLengkap'] ?? $details['namaLengkap'] ?? ''));
        if (!$name) continue;

        $rawId = (int)($p['id'] ?? 0);

        $phone = trim((string)($p['phone'] ?? $p['no_wa'] ?? $p['noWhatsapp'] ?? $details['noWhatsapp'] ?? ''));
        $email = trim((string)($p['email'] ?? $details['email'] ?? ''));
        $noKtp = trim((string)($p['noKtp'] ?? $p['no_ktp'] ?? $details['noKtp'] ?? ''));
        $program = trim((string)($p['program'] ?? $p['programMinat'] ?? $details['programMinat'] ?? 'Intensif Offline'));
        $metodePembayaran = trim((string)($details['metodePembayaran'] ?? $p['metodePembayaran'] ?? $p['metode_pembayaran'] ?? $p['tipe_pembayaran'] ?? ''));
        if ($metodePembayaran === '') {
            if (stripos($program, 'cicil') !== false) {
                $metodePembayaran = 'Cicilan';
            } elseif (stripos($program, 'full') !== false) {
                $metodePembayaran = 'Full Payment';
            }
        }
        $totalBiaya = (float)($p['total_biaya'] ?? $details['total_biaya'] ?? 0);

        $rawStatus = trim((string)($p['status'] ?? 'Aktif'));
        $status = ($rawStatus === 'Pembayaran' || $rawStatus === 'Pending') ? 'Menunggu Pembayaran' : ($rawStatus ?: 'Aktif');
        $kota = trim((string)($p['kotaDomisili'] ?? $p['kota'] ?? $details['kotaDomisili'] ?? 'Cianjur'));
        $lokasi = trim((string)($p['lokasiTinggal'] ?? $details['lokasiTinggal'] ?? ''));
        $alamatLengkap = trim((string)($details['alamatLengkap'] ?? ''));
        $alamat = $alamatLengkap !== '' ? ($alamatLengkap . ($kota ? ', ' . $kota : '')) : ($kota . ($lokasi ? ', ' . $lokasi : ', Jawa Barat'));
        $batch = !empty($p['batch']) ? trim((string)$p['batch']) : 'Batch 2';

        // Format NIS resmi LPK: TGCJ + Tahun(2 digit) + Bulan(2 digit) + ID urut (3 digit)
        $nis = !empty($p['nis']) ? trim((string)$p['nis']) : ('TGCJ' . date('ym') . str_pad($rawId ?: random_int(1, 999), 3, '0', STR_PAD_LEFT));

        $existing = null;
        if ($rawId > 0) {
            $stmt = $conn->prepare("SELECT id, nis FROM peserta_intensif WHERE web_id = ? LIMIT 1");
            $stmt->bind_param("i", $rawId);
            $stmt->execute();
            $existing = $stmt->get_result()->fetch_assoc();
            $stmt->close();
        }
        if (!$existing && $email !== '') {
            $stmt = $conn->prepare("SELECT id, nis FROM peserta_intensif WHERE email = ? LIMIT 1");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $existing = $stmt->get_result()->fetch_assoc();
            $stmt->close();
        }
        if (!$existing && $phone !== '' && $phone !== '-') {
            $stmt = $conn->prepare("SELECT id, nis FROM peserta_intensif WHERE no_wa = ? LIMIT 1");
            $stmt->bind_param("s", $phone);
            $stmt->execute();
            $existing = $stmt->get_result()->fetch_assoc();
            $stmt->close();
        }

        if ($existing) {
            $existingId = (int)$existing['id'];
            $existingNis = !empty($existing['nis']) ? $existing['nis'] : $nis;
            $updateStmt = $conn->prepare("UPDATE peserta_intensif SET nama_lengkap=?, no_wa=?, email=?, no_ktp=?, program=?, metode_pembayaran=?, total_biaya=?, status=?, kota=?, alamat=?, nis=?, batch=?, web_id=?, source='creativabridging.com' WHERE id=?");
            $updateStmt->bind_param("ssssssdsssssii", $name, $phone, $email, $noKtp, $program, $metodePembayaran, $totalBiaya, $status, $kota, $alamat, $existingNis, $batch, $rawId, $existingId);
            $updateStmt->execute();
            $updateStmt->close();
            $updated++;
        } else {
            $insertStmt = $conn->prepare("INSERT INTO peserta_intensif (nama_lengkap, no_wa, email, no_ktp, program, metode_pembayaran, total_biaya, status, kota, provinsi, negara, alamat, nis, batch, level, web_id, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Jawa Barat', 'Indonesia', ?, ?, ?, 'N5', ?, 'creativabridging.com')");
            $insertStmt->bind_param("ssssssdsssssi", $name, $phone, $email, $noKtp, $program, $metodePembayaran, $totalBiaya, $status, $kota, $alamat, $nis, $batch, $rawId);
            $insertStmt->execute();
            $insertStmt->close();
            $inserted++;
        }

        // ── Auto-Generate Invoice di billing_invoices HANYA UNTUK PENDAFTAR TERBARU ──
        // Jika web_id sudah pernah diproses oleh robot (baik invoicenya masih ada atau telah dihapus admin),
        // JANGAN PERNAH dibuat ulang (mencegah data yang sudah dihapus muncul kembali)!
        $procStmt = $conn->prepare("SELECT web_id FROM rpa_processed_registrations WHERE web_id = ? LIMIT 1");
        $procStmt->bind_param("i", $rawId);
        $procStmt->execute();
        $alreadyProcessed = (bool)$procStmt->get_result()->fetch_assoc();
        $procStmt->close();

        if ($alreadyProcessed) {
            continue;
        }

        $createdAt = trim((string)($p['created_at'] ?? ''));
        $createdTime = $createdAt !== '' ? strtotime($createdAt) : 0;
        $todayStart = strtotime('2026-11-13 00:00:00');
        // Hanya proses pendaftar baru sesi hari ini (web_id >= 100 atau didaftarkan hari ini)
        $isNewApplicant = ($rawId >= 100) || ($createdTime >= $todayStart);

        $studentNis = !empty($existingNis) ? $existingNis : $nis;
        $webIdPattern = '%"web_id":' . $rawId . '%';
        $checkInvStmt = $conn->prepare("SELECT id FROM billing_invoices WHERE (meta_json LIKE ? OR id = ?) LIMIT 1");
        $checkInvStmt->bind_param("ss", $webIdPattern, $studentNis);
        $checkInvStmt->execute();
        $invFound = $checkInvStmt->get_result()->fetch_assoc();
        $checkInvStmt->close();

        if (!$invFound && $isNewApplicant) {
            $isCicilan = (stripos($metodePembayaran, 'cicil') !== false || stripos($metodePembayaran, 'dp') !== false || stripos($program, 'intensif') !== false);
            $finalTotal = $totalBiaya > 0 ? (float)$totalBiaya : 15000000.00;
            $metodeLabel = $isCicilan ? 'Cicilan' : 'Full Payment';
            $keterangan = "{$program} ({$metodeLabel})";

            $installments = [];
            if ($isCicilan) {
                $presetCicilan = [5000000, 3000000, 2500000, 1500000, 1500000, 1500000];
                foreach ($presetCicilan as $cIdx => $cAmt) {
                    $installments[] = [
                        'id' => $cIdx + 1,
                        'deskripsi' => 'Cicilan ' . ($cIdx + 1),
                        'keterangan' => 'CICILAN ' . ($cIdx + 1),
                        'jatuhTempo' => date('Y-m-d', strtotime("+2 days +{$cIdx} month")),
                        'nominal' => (float)$cAmt,
                    ];
                }
            } else {
                $installments[] = [
                    'id' => 1,
                    'deskripsi' => 'FULL PAYMENT',
                    'keterangan' => 'FULL PAYMENT',
                    'jatuhTempo' => date('Y-m-d', strtotime('+2 days')),
                    'nominal' => (float)$finalTotal,
                ];
            }

            // Generate Invoice ID resmi: TGCJ + YYMM + 4 digit
            $prefix = 'TGCJ' . date('ym');
            $numRes = mysqli_query($conn, "SELECT id FROM billing_invoices WHERE id LIKE '{$prefix}%' ORDER BY id DESC LIMIT 1");
            $nextSeq = 1;
            if ($numRes && $row = mysqli_fetch_assoc($numRes)) {
                $tail = substr((string)$row['id'], strlen($prefix));
                if (ctype_digit($tail)) {
                    $nextSeq = (int)$tail + 1;
                }
            }
            $invoiceId = $prefix . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);
            $token = bin2hex(random_bytes(16));
            $today = date('Y-m-d');
            $firstDue = $installments[0]['jatuhTempo'] ?? date('Y-m-d', strtotime('+2 days'));

            $metaArray = [
                'skema' => $isCicilan ? 'cicilan' : 'full',
                'program' => $program,
                'lokasi' => $kota ?: 'Cianjur',
                'durasi' => '7 Bulan',
                'subtotal' => (float)$finalTotal,
                'items' => [[
                    'id' => 1,
                    'deskripsi' => "{$program} ({$metodeLabel})",
                    'subdeskripsi' => "Biaya Pendidikan Bahasa Jepang dan Pelatihan Skill - " . ($kota ?: 'Cianjur'),
                    'harga' => (float)$finalTotal,
                    'diskon' => 0,
                    'jumlah' => (float)$finalTotal,
                ]],
                'installments' => $installments,
                'includes' => [
                    'Biaya Pelatihan Bahasa Jepang & Skill',
                    'Buku Modul dan Materi Pelatihan',
                    'Bimbingan Wawancara & Matching Perusahaan',
                    'Sertifikat Pelatihan Resmi LPK'
                ],
                'excludes' => [
                    'Biaya Utilitas (Air, Listrik, Internet & IPL Asrama)',
                    'Biaya Makan',
                    'Keperluan Pribadi Lainnya'
                ],
                'bank_name' => 'BCA',
                'account_number' => '1832-918-428',
                'account_holder' => 'CREATIVA BRIDGING INTERN',
                'source' => 'rpa-web-sync',
                'web_id' => $rawId,
            ];
            $metaJson = json_encode($metaArray, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            $insStmt = $conn->prepare("INSERT INTO billing_invoices (id, tanggal, customer, email, phone, total, status, jatuhTempo, keterangan, public_token, meta_json, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Unpaid', ?, ?, ?, ?, NOW())");
            $insStmt->bind_param("sssssdssss", $invoiceId, $today, $name, $email, $phone, $finalTotal, $firstDue, $keterangan, $token, $metaJson);
            $insStmt->execute();
            $insStmt->close();

            $urls = rpa_build_public_urls($invoiceId, $token);

            // Kirim notifikasi WA & Email otomatis dengan tenggat waktu 2x24 jam via SMTP & Gateway
            $notifRes = rpa_send_invoice_notifications(
                $conn,
                $invoiceId,
                $name,
                $email,
                $phone,
                $program,
                $finalTotal,
                $installments,
                $firstDue,
                $urls['status_url'],
                $urls['invoice_url']
            );

            // Sinkronisasi otomatis rincian termin cicilan ke Student Dashboard creativabridging.com
            rpa_sync_invoices_to_remote_student_dashboard((int)$rawId, $invoiceId, (float)$finalTotal, $installments, $urls['invoice_url']);

            // Catat ke billing_terkirim untuk Email (jika ada)
            if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $eStatus = !empty($notifRes['email_sent']) ? 'Terkirim' : 'Gagal';
                $eId = $invoiceId . '-EML';
                $eStmt = $conn->prepare("REPLACE INTO billing_terkirim (id, tglKirim, customer, kanal, penerima, statusKirim, statusBaca, created_at) VALUES (?, ?, ?, 'Email', ?, ?, 'Pending', NOW())");
                if ($eStmt) {
                    $eStmt->bind_param("sssss", $eId, $today, $name, $email, $eStatus);
                    $eStmt->execute();
                    $eStmt->close();
                }
            }

            // Catat ke billing_terkirim untuk WhatsApp (jika ada)
            if (!empty($phone) && $phone !== '-') {
                $wStatus = !empty($notifRes['wa_sent']) ? 'Terkirim' : 'Siap Kirim';
                $wStmt = $conn->prepare("REPLACE INTO billing_terkirim (id, tglKirim, customer, kanal, penerima, statusKirim, statusBaca, created_at) VALUES (?, ?, ?, 'WhatsApp', ?, ?, 'Pending', NOW())");
                if ($wStmt) {
                    $wStmt->bind_param("sssss", $invoiceId, $today, $name, $phone, $wStatus);
                    $wStmt->execute();
                    $wStmt->close();
                }
            }

            // Tandai web_id ini sudah diproses agar TIDAK PERNAH dibuat ulang jika admin menghapusnya
            $recProc = $conn->prepare("INSERT INTO rpa_processed_registrations (web_id, invoice_id, customer, created_at) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE invoice_id=VALUES(invoice_id)");
            if ($recProc) {
                $recProc->bind_param("iss", $rawId, $invoiceId, $name);
                $recProc->execute();
                $recProc->close();
            }

            $createdInvoices++;
        }
    }

    // Ambil data terbaru setelah sync
    $allStudents = [];
    $res = mysqli_query($conn, "SELECT id, nama_lengkap AS name, nama_lengkap AS nama, no_wa, no_wa AS kontak, email, no_ktp, program, metode_pembayaran, total_biaya, status, kota, provinsi, negara, alamat, nis, batch, level, web_id, source, created_at FROM peserta_intensif WHERE source = 'creativabridging.com' OR web_id IS NOT NULL ORDER BY id DESC");
    while ($r = mysqli_fetch_assoc($res)) {
        $r['fromWeb'] = true;
        $allStudents[] = $r;
    }

    echo json_encode([
        'status' => 'success',
        'message' => "Data siswa dan invoice berhasil disinkronkan. $inserted siswa ditambahkan, $updated siswa diperbarui, dan $createdInvoices invoice otomatis dibuat.",
        'total' => count($allStudents),
        'inserted' => $inserted,
        'updated' => $updated,
        'created_invoices' => $createdInvoices,
        'students' => $allStudents
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log('Student sync failed: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage() ?: 'Gagal menyinkronkan data siswa.'
    ]);
}
