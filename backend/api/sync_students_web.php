<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';

try {
    // 1. Ambil data pendaftar dari creativabridging.com
    $remoteData = null;
    $rawInput = file_get_contents('php://input');
    if ($rawInput) {
        $body = json_decode($rawInput, true);
        if (!empty($body['students']) && is_array($body['students'])) {
            $remoteData = $body['students'];
        }
    }

    if (!$remoteData) {
        $apiUrl = "https://creativabridging.com/api_peserta.php?api_key=CREATIVA_SYNC_SECRET_2026";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'OneCreativa/2.0 (Sync)');
        $response = curl_exec($ch);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($response) {
            $json = json_decode($response, true);
            if (!empty($json['data']) && is_array($json['data'])) {
                $remoteData = $json['data'];
            }
        }
    }

    if (!$remoteData || !is_array($remoteData)) {
        // Fallback: Jika koneksi server ke luar terhambat, kembalikan data lokal yang ada
        $localStudents = [];
        $res = mysqli_query($conn, "SELECT * FROM peserta_intensif ORDER BY id DESC");
        while ($r = mysqli_fetch_assoc($res)) {
            $localStudents[] = $r;
        }
        echo json_encode([
            'status' => 'partial',
            'message' => 'Tidak dapat terhubung ke endpoint creativabridging.com secara langsung dari server. Menggunakan data lokal.',
            'total_synced' => 0,
            'students' => $localStudents
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

    $inserted = 0;
    $updated = 0;
    $deleted = 0;
    $activeWebIds = [];

    foreach ($remoteData as $p) {
        $name = trim($p['nama'] ?? $p['nama_lengkap'] ?? '');
        if (!$name) continue;

        $rawId = (int)($p['id'] ?? 0);
        if ($rawId > 0) {
            $activeWebIds[] = $rawId;
        }

        $phone = trim($p['phone'] ?? $p['no_wa'] ?? '');
        $email = trim($p['email'] ?? '');
        $noKtp = trim($p['noKtp'] ?? $p['no_ktp'] ?? '');
        $program = trim($p['program'] ?? 'Program Pelatihan Jepang');
        $rawStatus = trim($p['status'] ?? 'Aktif');
        $status = ($rawStatus === 'Pembayaran' || $rawStatus === 'Pending') ? 'Menunggu Pembayaran' : ($rawStatus ?: 'Aktif');
        $kota = trim($p['kotaDomisili'] ?? $p['kota'] ?? 'Cianjur');
        $lokasi = trim($p['lokasiTinggal'] ?? '');
        $alamat = $kota . ($lokasi ? ', ' . $lokasi : ', Jawa Barat');
        $batch = !empty($p['batch']) ? $p['batch'] : 'Batch 2';

        // Format NIS resmi LPK: TGCJ + Tahun(2 digit) + Bulan(2 digit) + ID urut (3 digit)
        $nis = !empty($p['nis']) ? $p['nis'] : ('TGCJ' . $currentYear . $currentMonth . str_pad($rawId ?: rand(1, 999), 3, '0', STR_PAD_LEFT));

        // Cek apakah siswa sudah ada di peserta_intensif
        $stmt = $conn->prepare("SELECT id, nis FROM peserta_intensif WHERE email = ? OR nama_lengkap = ? OR (no_wa = ? AND no_wa != '' AND no_wa != '-') LIMIT 1");
        $stmt->bind_param("sss", $email, $name, $phone);
        $stmt->execute();
        $existing = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($existing) {
            $existingId = $existing['id'];
            $existingNis = !empty($existing['nis']) ? $existing['nis'] : $nis;
            $updateStmt = $conn->prepare("UPDATE peserta_intensif SET no_wa=?, email=?, no_ktp=?, program=?, status=?, kota=?, alamat=?, nis=?, web_id=?, source='creativabridging.com' WHERE id=?");
            $updateStmt->bind_param("ssssssssii", $phone, $email, $noKtp, $program, $status, $kota, $alamat, $existingNis, $rawId, $existingId);
            $updateStmt->execute();
            $updateStmt->close();
            $updated++;
        } else {
            $insertStmt = $conn->prepare("INSERT INTO peserta_intensif (nama_lengkap, no_wa, email, no_ktp, program, status, kota, provinsi, negara, alamat, nis, batch, level, web_id, source) VALUES (?, ?, ?, ?, ?, ?, ?, 'Jawa Barat', 'Indonesia', ?, ?, ?, 'N5', ?, 'creativabridging.com')");
            $insertStmt->bind_param("ssssssssssi", $name, $phone, $email, $noKtp, $program, $status, $kota, $alamat, $nis, $batch, $rawId);
            $insertStmt->execute();
            $insertStmt->close();
            $inserted++;
        }
    }

    // ── DELETION MIRRORING DARI WEB ──
    // Jika peserta dihapus dari web creativabridging.com, data di sini juga ikut dihapus
    if (!empty($activeWebIds)) {
        $idListStr = implode(',', array_unique($activeWebIds));
        mysqli_query($conn, "DELETE FROM peserta_intensif WHERE (source = 'creativabridging.com' OR web_id IS NOT NULL) AND web_id > 0 AND web_id NOT IN ($idListStr)");
        $deleted = mysqli_affected_rows($conn);
    } else if (count($remoteData) === 0) {
        mysqli_query($conn, "DELETE FROM peserta_intensif WHERE source = 'creativabridging.com' OR web_id IS NOT NULL");
        $deleted = mysqli_affected_rows($conn);
    }

    // ── AUTO-GENERATE INVOICE TAGIHAN (LAYER 2 INTEGRASI KEUANGAN) ──
    // Siswa pendaftar dari website yang belum memiliki invoice akan dibuatkan invoice otomatis
    $invoicesGenerated = 0;
    $todayDate = date('Y-m-d');
    $dueDate = date('Y-m-d', strtotime('+14 days'));
    $prefix = 'INV-' . date('Ym') . '-';

    // Ambil nomor urut invoice tertinggi saat ini
    $numRes = mysqli_query($conn, "SELECT id FROM billing_invoices WHERE id LIKE '$prefix%' ORDER BY id DESC LIMIT 1");
    $currSeq = 1;
    if ($numRes && $rowSeq = mysqli_fetch_assoc($numRes)) {
        $currSeq = (int)substr($rowSeq['id'], -4) + 1;
    }

    $webStudentsQuery = mysqli_query($conn, "SELECT id, nama_lengkap, no_wa, email, program, nis FROM peserta_intensif WHERE source = 'creativabridging.com' ORDER BY id ASC");
    while ($ws = mysqli_fetch_assoc($webStudentsQuery)) {
        $studentName = $ws['nama_lengkap'];
        $studentNis = $ws['nis'];
        $studentPhone = $ws['no_wa'];
        $studentEmail = $ws['email'];
        $studentProgram = $ws['program'] ?: 'Program Pelatihan Jepang';

        // Cek apakah sudah ada invoice atas nama siswa ini atau nis ini
        $chkStmt = $conn->prepare("SELECT id FROM billing_invoices WHERE customer = ? OR id = ? LIMIT 1");
        $chkStmt->bind_param("ss", $studentName, $studentNis);
        $chkStmt->execute();
        $hasInvoice = (bool)$chkStmt->get_result()->fetch_assoc();
        $chkStmt->close();

        if (!$hasInvoice) {
            $invId = $prefix . str_pad($currSeq++, 4, '0', STR_PAD_LEFT);
            $amount = 15000000.00;
            if (stripos($studentProgram, 'sotsugyousei') !== false) {
                $amount = 7500000.00;
            } elseif (stripos($studentProgram, 'reguler') !== false) {
                $amount = 5000000.00;
            }

            $desc = "Biaya Pendaftaran & Pelatihan: " . $studentProgram . " (Otomatis dari Registrasi Web)";
            $insInv = $conn->prepare("INSERT INTO billing_invoices (id, tanggal, customer, email, phone, total, status, jatuhTempo, keterangan, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Unpaid', ?, ?, NOW())");
            $insInv->bind_param("sssssdss", $invId, $todayDate, $studentName, $studentEmail, $studentPhone, $amount, $dueDate, $desc);
            $insInv->execute();
            $insInv->close();

            // Insert ke billing_terkirim
            $kanal = ($studentPhone && $studentPhone !== '-') ? 'WhatsApp' : 'Email';
            $penerima = $kanal === 'WhatsApp' ? $studentPhone : ($studentEmail ?: '-');
            $insTerkirim = $conn->prepare("INSERT INTO billing_terkirim (id, tglKirim, customer, kanal, penerima, statusKirim, statusBaca, created_at) VALUES (?, ?, ?, ?, ?, 'Terkirim', 'Pending', NOW())");
            $insTerkirim->bind_param("sssss", $invId, $todayDate, $studentName, $kanal, $penerima);
            $insTerkirim->execute();
            $insTerkirim->close();

            $invoicesGenerated++;
        }
    }

    // Ambil data terbaru setelah sync
    $allStudents = [];
    $res = mysqli_query($conn, "SELECT id, nama_lengkap AS name, nama_lengkap AS nama, no_wa, no_wa AS kontak, email, no_ktp, program, status, kota, provinsi, negara, alamat, nis, batch, level, web_id, source, created_at FROM peserta_intensif ORDER BY id DESC");
    while ($r = mysqli_fetch_assoc($res)) {
        $r['fromWeb'] = true;
        $allStudents[] = $r;
    }

    $msgDetail = "$inserted ditambahkan, $updated diperbarui";
    if ($invoicesGenerated > 0) $msgDetail .= ", $invoicesGenerated invoice otomatis diterbitkan";
    if ($deleted > 0) $msgDetail .= ", $deleted dihapus (karena sudah dihapus di web)";

    echo json_encode([
        'status' => 'success',
        'message' => "Berhasil sinkronisasi data pendaftar dari creativabridging.com. ($msgDetail)",
        'total' => count($allStudents),
        'inserted' => $inserted,
        'updated' => $updated,
        'deleted' => $deleted,
        'invoices_generated' => $invoicesGenerated,
        'students' => $allStudents
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Gagal sinkronisasi data siswa: ' . $e->getMessage()
    ]);
}
