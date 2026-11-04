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

    $apiUrl = "https://creativabridging.com/api_peserta.php?api_key=CREATIVA_SYNC_SECRET_2026";
    $ch = curl_init($apiUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_USERAGENT => 'OneCreativa/2.0 (Sync)',
    ]);
    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpStatus = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpStatus < 200 || $httpStatus >= 300) {
        error_log('Student sync upstream request failed: ' . ($curlError ?: 'HTTP ' . $httpStatus));
        throw new RuntimeException('Data siswa dari web pendaftaran gagal diambil. Silakan coba lagi.');
    }

    $payload = json_decode($response, true);
    if (!is_array($payload) || !isset($payload['data']) || !is_array($payload['data'])) {
        throw new RuntimeException('Respons data siswa dari web pendaftaran tidak valid.');
    }
    $remoteData = $payload['data'];

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
            mysqli_query($conn, "ALTER TABLE `peserta_intensif` ADD COLUMN `$colName` $colDef");
        }
    }

    $inserted = 0;
    $updated = 0;

    foreach ($remoteData as $p) {
        $name = trim($p['nama'] ?? $p['nama_lengkap'] ?? '');
        if (!$name) continue;

        $rawId = (int)($p['id'] ?? 0);

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
        $nis = !empty($p['nis']) ? $p['nis'] : ('TGCJ' . date('ym') . str_pad($rawId ?: random_int(1, 999), 3, '0', STR_PAD_LEFT));

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
            $existingId = $existing['id'];
            $existingNis = !empty($existing['nis']) ? $existing['nis'] : $nis;
            $updateStmt = $conn->prepare("UPDATE peserta_intensif SET nama_lengkap=?, no_wa=?, email=?, no_ktp=?, program=?, status=?, kota=?, alamat=?, nis=?, batch=?, web_id=?, source='creativabridging.com' WHERE id=?");
            $updateStmt->bind_param("ssssssssssii", $name, $phone, $email, $noKtp, $program, $status, $kota, $alamat, $existingNis, $batch, $rawId, $existingId);
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

    // Ambil data terbaru setelah sync
    $allStudents = [];
    $res = mysqli_query($conn, "SELECT id, nama_lengkap AS name, nama_lengkap AS nama, no_wa, no_wa AS kontak, email, no_ktp, program, status, kota, provinsi, negara, alamat, nis, batch, level, web_id, source, created_at FROM peserta_intensif WHERE source = 'creativabridging.com' OR web_id IS NOT NULL ORDER BY id DESC");
    while ($r = mysqli_fetch_assoc($res)) {
        $r['fromWeb'] = true;
        $allStudents[] = $r;
    }

    echo json_encode([
        'status' => 'success',
        'message' => "Data siswa berhasil disinkronkan. $inserted siswa ditambahkan dan $updated siswa diperbarui. Tidak ada invoice yang dibuat atau dikirim.",
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
