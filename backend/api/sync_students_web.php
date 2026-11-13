<?php
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/api_session_guard.php';
require_once __DIR__ . '/../services/registration_sync.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Metode permintaan tidak didukung.']);
        exit;
    }

    $actor = api_session_guard($conn, 'prepare');

    $fetchJson = function (string $url) {
        if (defined('CREATIVA_TEST_ROUTER') && defined('CREATIVA_REGISTRATION_SYNC_FIXTURE')) {
            return ['ok' => true, 'error' => '', 'data' => ['data' => json_decode(file_get_contents(CREATIVA_REGISTRATION_SYNC_FIXTURE), true, 512, JSON_THROW_ON_ERROR)]];
        }
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

    $inserted = 0; $updated = 0; $reviews = [];
    foreach ($remoteData as $p) {
        if (!is_array($p)) ac_fail('Data pendaftar tidak valid.');
        $result = registration_process($conn, $actor, $p, 'sync');
        if ($result['student']) { if ($result['student_created']) $inserted++; else $updated++; }
        if ($result['pricing']['status'] === 'needs_review') $reviews[] = ['student_id' => $result['student']['id'] ?? null, 'pricing_status' => 'needs_review', 'reason' => $result['pricing']['reason']];
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
        'students' => $allStudents,
        'pricing_needs_review' => count($reviews),
        'pricing_reviews' => $reviews
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log('Student sync failed: ' . $e->getMessage());
    http_response_code($e instanceof AccountingException ? $e->getCode() : 500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage() ?: 'Gagal menyinkronkan data siswa.'
    ]);
}
