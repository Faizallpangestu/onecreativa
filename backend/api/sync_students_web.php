<?php
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/api_session_guard.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Metode permintaan tidak didukung.']);
        exit;
    }

    api_session_guard($conn, 'prepare');

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
        'message' => "Data siswa, program, dan skema pembayaran berhasil disinkronkan. $inserted siswa ditambahkan dan $updated siswa diperbarui.",
        'total' => count($allStudents),
        'inserted' => $inserted,
        'updated' => $updated,
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
