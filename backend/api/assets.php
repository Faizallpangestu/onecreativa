<?php
/**
 * ONE Creativa - Assets REST API
 * GET    /assets.php              → List semua aset (dengan filter)
 * GET    /assets.php?id=X         → Detail 1 aset + riwayat
 * GET    /assets.php?qr_code=X    → Lookup via QR code (untuk scan)
 * GET    /assets.php?stats=1      → Statistik summary
 * POST   /assets.php              → Tambah aset baru
 * PUT    /assets.php?id=X         → Update aset
 * DELETE /assets.php?id=X         → Hapus aset
 */

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require '../config/database.php';

function respond($statusCode, $payload) {
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function generateAssetCode($conn) {
    $year = date('Y');
    // Ambil kode terakhir untuk tahun ini
    $result = mysqli_query($conn, "SELECT asset_code FROM assets WHERE asset_code LIKE 'AST-$year-%' ORDER BY id DESC LIMIT 1");
    $last = mysqli_fetch_assoc($result);
    if ($last) {
        $parts = explode('-', $last['asset_code']);
        $num = (int)end($parts) + 1;
    } else {
        $num = 1;
    }
    return 'AST-' . $year . '-' . str_pad($num, 4, '0', STR_PAD_LEFT);
}

$method = $_SERVER['REQUEST_METHOD'];

// Method override: POST dengan ?_method=PUT atau POST body _method
if ($method === 'POST') {
    $override = $_GET['_method'] ?? ($_POST['_method'] ?? '');
    if (strtoupper($override) === 'PUT') {
        $method = 'PUT';
    }
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// ─── GET ────────────────────────────────────────────────────────────────────
if ($method === 'GET') {

    // --- Stats summary ---
    if (!empty($_GET['stats'])) {
        $total      = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM assets"))['c'];
        $aktif      = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM assets WHERE status='Aktif'"))['c'];
        $maintenance= mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM assets WHERE status='Maintenance'"))['c'];
        $tidak_aktif= mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM assets WHERE status='Tidak Aktif'"))['c'];
        $dipinjam   = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM assets WHERE status='Dipinjam'"))['c'];
        $nilai_total= mysqli_fetch_assoc(mysqli_query($conn, "SELECT COALESCE(SUM(purchase_price),0) as total FROM assets"))['total'];
        
        // Per kategori
        $cat_result = mysqli_query($conn, "SELECT category, COUNT(*) as jumlah FROM assets GROUP BY category ORDER BY jumlah DESC");
        $per_kategori = [];
        while ($row = mysqli_fetch_assoc($cat_result)) $per_kategori[] = $row;

        // Per kondisi
        $cond_result = mysqli_query($conn, "SELECT `condition`, COUNT(*) as jumlah FROM assets GROUP BY `condition`");
        $per_kondisi = [];
        while ($row = mysqli_fetch_assoc($cond_result)) $per_kondisi[] = $row;

        // Hitungan riwayat
        $hist_pindah = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM asset_histories WHERE action_type='pindah'"))['c'];
        $hist_pinjam = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM asset_histories WHERE action_type='pinjam'"))['c'];
        $hist_maint = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM asset_histories WHERE action_type='maintenance'"))['c'];
        $hist_so = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as c FROM asset_histories WHERE action_type='stock_opname'"))['c'];

        respond(200, [
            'status' => 'success',
            'data' => [
                'total' => $total,
                'aktif' => $aktif,
                'maintenance' => $maintenance,
                'tidak_aktif' => $tidak_aktif,
                'dipinjam' => $dipinjam,
                'nilai_total' => (float)$nilai_total,
                'per_kategori' => $per_kategori,
                'per_kondisi' => $per_kondisi,
                'riwayat' => [
                    'pindah' => $hist_pindah,
                    'pinjam' => $hist_pinjam,
                    'maintenance' => $hist_maint,
                    'cek_fisik' => $hist_so
                ]
            ]
        ]);
    }

    // --- Lookup via QR Code ---
    if (!empty($_GET['qr_code'])) {
        $qr = mysqli_real_escape_string($conn, $_GET['qr_code']);
        $result = mysqli_query($conn, "SELECT a.*, e.full_name as created_by_name FROM assets a LEFT JOIN employees e ON a.created_by=e.id WHERE a.qr_code='$qr' OR a.asset_code='$qr' LIMIT 1");
        if (!$result || mysqli_num_rows($result) === 0) {
            respond(404, ['status' => 'error', 'message' => 'Aset tidak ditemukan dengan QR code ini']);
        }
        $asset = mysqli_fetch_assoc($result);
        
        // Ambil riwayat terbaru
        $hist = mysqli_query($conn, "SELECT ah.*, e.full_name as performed_by_name FROM asset_histories ah LEFT JOIN employees e ON ah.performed_by=e.id WHERE ah.asset_id={$asset['id']} ORDER BY ah.performed_at DESC LIMIT 5");
        $histories = [];
        while ($h = mysqli_fetch_assoc($hist)) $histories[] = $h;
        $asset['recent_histories'] = $histories;
        
        respond(200, ['status' => 'success', 'data' => $asset]);
    }

    // --- Detail 1 aset ---
    if ($id > 0) {
        $result = mysqli_query($conn, "SELECT a.*, e.full_name as created_by_name FROM assets a LEFT JOIN employees e ON a.created_by=e.id WHERE a.id=$id LIMIT 1");
        if (!$result || mysqli_num_rows($result) === 0) {
            respond(404, ['status' => 'error', 'message' => 'Aset tidak ditemukan']);
        }
        $asset = mysqli_fetch_assoc($result);

        // Riwayat
        $hist = mysqli_query($conn, "SELECT ah.*, e.full_name as performed_by_name FROM asset_histories ah LEFT JOIN employees e ON ah.performed_by=e.id WHERE ah.asset_id=$id ORDER BY ah.performed_at DESC");
        $histories = [];
        while ($h = mysqli_fetch_assoc($hist)) $histories[] = $h;
        $asset['histories'] = $histories;

        respond(200, ['status' => 'success', 'data' => $asset]);
    }

    // --- List semua aset (dengan filter) ---
    $where = [];
    if (!empty($_GET['category']))  $where[] = "a.category = '" . mysqli_real_escape_string($conn, $_GET['category']) . "'";
    if (!empty($_GET['location']))  $where[] = "a.location LIKE '%" . mysqli_real_escape_string($conn, $_GET['location']) . "%'";
    if (!empty($_GET['condition'])) $where[] = "a.`condition` = '" . mysqli_real_escape_string($conn, $_GET['condition']) . "'";
    if (!empty($_GET['status']))    $where[] = "a.status = '" . mysqli_real_escape_string($conn, $_GET['status']) . "'";
    if (!empty($_GET['search'])) {
        $s = mysqli_real_escape_string($conn, $_GET['search']);
        $where[] = "(a.name LIKE '%$s%' OR a.asset_code LIKE '%$s%' OR a.brand LIKE '%$s%' OR a.serial_number LIKE '%$s%' OR a.location LIKE '%$s%')";
    }

    $whereStr = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';
    $sql = "SELECT a.*, e.full_name as created_by_name FROM assets a LEFT JOIN employees e ON a.created_by=e.id $whereStr ORDER BY a.created_at DESC";
    $result = mysqli_query($conn, $sql);
    if (!$result) respond(500, ['status' => 'error', 'message' => mysqli_error($conn)]);

    $data = [];
    while ($row = mysqli_fetch_assoc($result)) $data[] = $row;
    respond(200, ['status' => 'success', 'data' => $data, 'total' => count($data)]);
}

// ─── POST ───────────────────────────────────────────────────────────────────
if ($method === 'POST') {
    // Cek apakah ada file upload (multipart)
    $isMultipart = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart') !== false;

    if ($isMultipart) {
        $data = $_POST;
    } else {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
    }

    $name          = trim($data['name'] ?? '');
    $category      = $data['category'] ?? 'Elektronik';
    $brand         = $data['brand'] ?? '';
    $model         = $data['model'] ?? '';
    $serial_number = $data['serial_number'] ?? '';
    $purchase_date = $data['purchase_date'] ?? null;
    $purchase_price= (float)($data['purchase_price'] ?? 0);
    $location      = $data['location'] ?? 'Kantor Pusat';
    $condition_val = $data['condition'] ?? 'Baik';
    $status        = $data['status'] ?? 'Aktif';
    $description   = $data['description'] ?? '';
    $created_by = (int)$GLOBALS['verified_api_actor']['id'];

    if (empty($name)) respond(400, ['status' => 'error', 'message' => 'Nama aset wajib diisi']);

    $asset_code = generateAssetCode($conn);
    $qr_code    = $asset_code; // QR berisi kode aset

    // Handle foto upload
    $photo_path = null;
    if (!empty($_FILES['photo']) && $_FILES['photo']['error'] === 0) {
        $mime=(new finfo(FILEINFO_MIME_TYPE))->file($_FILES['photo']['tmp_name']);$types=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];if(!isset($types[$mime])||$_FILES['photo']['size']>5*1024*1024||!is_uploaded_file($_FILES['photo']['tmp_name']))ac_fail('Foto aset harus JPG/PNG/WebP maksimal 5 MB.');$ext=$types[$mime];
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) {
            respond(400, ['status' => 'error', 'message' => 'Format foto tidak valid (jpg/png/webp)']);
        }
        $filename   = $asset_code . '_' . time() . '.' . $ext;
        $uploadDir  = __DIR__ . '/../uploads/asset_photos/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        if (move_uploaded_file($_FILES['photo']['tmp_name'], $uploadDir . $filename)) {
            $photo_path = 'asset_photos/' . $filename;
        }
    }

    $safeName    = mysqli_real_escape_string($conn, $name);
    $safeCat     = mysqli_real_escape_string($conn, $category);
    $safeBrand   = mysqli_real_escape_string($conn, $brand);
    $safeModel   = mysqli_real_escape_string($conn, $model);
    $safeSN      = mysqli_real_escape_string($conn, $serial_number);
    $safeLoc     = mysqli_real_escape_string($conn, $location);
    $safeCond    = mysqli_real_escape_string($conn, $condition_val);
    $safeStatus  = mysqli_real_escape_string($conn, $status);
    $safeDesc    = mysqli_real_escape_string($conn, $description);
    $safePhoto   = $photo_path ? "'" . mysqli_real_escape_string($conn, $photo_path) . "'" : "NULL";
    $safeDate    = $purchase_date ? "'" . mysqli_real_escape_string($conn, $purchase_date) . "'" : "NULL";
    $safeCreator = $created_by > 0 ? $created_by : "NULL";

    $sql = "INSERT INTO assets (asset_code, name, category, brand, model, serial_number, purchase_date, purchase_price, location, `condition`, status, description, photo_path, qr_code, created_by)
            VALUES ('$asset_code', '$safeName', '$safeCat', '$safeBrand', '$safeModel', '$safeSN', $safeDate, $purchase_price, '$safeLoc', '$safeCond', '$safeStatus', '$safeDesc', $safePhoto, '$qr_code', $safeCreator)";

    if (mysqli_query($conn, $sql)) {
        $newId = mysqli_insert_id($conn);
        // Catat riwayat awal
        mysqli_query($conn, "INSERT INTO asset_histories (asset_id, action_type, to_location, condition_after, status_after, notes, performed_by) VALUES ($newId, 'tambah', '$safeLoc', '$safeCond', '$safeStatus', 'Aset baru ditambahkan ke sistem', $safeCreator)");
        respond(201, ['status' => 'success', 'message' => 'Aset berhasil ditambahkan', 'asset_code' => $asset_code, 'id' => $newId]);
    } else {
        respond(500, ['status' => 'error', 'message' => 'Gagal menyimpan: ' . mysqli_error($conn)]);
    }
}

// ─── PUT ────────────────────────────────────────────────────────────────────
if ($method === 'PUT') {
    if ($id <= 0) respond(400, ['status' => 'error', 'message' => 'ID tidak valid']);

    $isMultipart = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart') !== false;
    if ($isMultipart) {
        // PHP tidak parse PUT multipart otomatis, gunakan POST dengan _method=PUT via form
        parse_str(file_get_contents('php://input'), $data);
        if (empty($data)) $data = $_POST;
    } else {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
    }

    // Ambil data lama untuk riwayat
    $old = mysqli_fetch_assoc(mysqli_query($conn, "SELECT * FROM assets WHERE id=$id"));
    if (!$old) respond(404, ['status' => 'error', 'message' => 'Aset tidak ditemukan']);

    $name          = trim($data['name'] ?? $old['name']);
    $category      = $data['category'] ?? $old['category'];
    $brand         = $data['brand'] ?? $old['brand'];
    $model         = $data['model'] ?? $old['model'];
    $serial_number = $data['serial_number'] ?? $old['serial_number'];
    $purchase_date = !empty($data['purchase_date']) ? $data['purchase_date'] : $old['purchase_date'];
    $purchase_price= isset($data['purchase_price']) ? (float)$data['purchase_price'] : (float)$old['purchase_price'];
    $new_location  = $data['location'] ?? $old['location'];
    $new_condition = $data['condition'] ?? $old['condition'];
    $new_status    = $data['status'] ?? $old['status'];
    $description   = $data['description'] ?? $old['description'];
    $updated_by = (int)$GLOBALS['verified_api_actor']['id'];

    // Handle foto
    $photo_path = $old['photo_path'];
    if (!empty($_FILES['photo']) && $_FILES['photo']['error'] === 0) {
        $mime=(new finfo(FILEINFO_MIME_TYPE))->file($_FILES['photo']['tmp_name']);$types=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];if(!isset($types[$mime])||$_FILES['photo']['size']>5*1024*1024||!is_uploaded_file($_FILES['photo']['tmp_name']))ac_fail('Foto aset harus JPG/PNG/WebP maksimal 5 MB.');$ext=$types[$mime];
        $filename = $old['asset_code'] . '_' . time() . '.' . $ext;
        $uploadDir = __DIR__ . '/../uploads/asset_photos/';
        if (move_uploaded_file($_FILES['photo']['tmp_name'], $uploadDir . $filename)) {
            $photo_path = 'asset_photos/' . $filename;
        }
    }

    $safeName   = mysqli_real_escape_string($conn, $name);
    $safeCat    = mysqli_real_escape_string($conn, $category);
    $safeBrand  = mysqli_real_escape_string($conn, $brand);
    $safeModel  = mysqli_real_escape_string($conn, $model);
    $safeSN     = mysqli_real_escape_string($conn, $serial_number);
    $safeLoc    = mysqli_real_escape_string($conn, $new_location);
    $safeCond   = mysqli_real_escape_string($conn, $new_condition);
    $safeStatus = mysqli_real_escape_string($conn, $new_status);
    $safeDesc   = mysqli_real_escape_string($conn, $description);
    $safePhoto  = mysqli_real_escape_string($conn, $photo_path ?? '');
    $safeDate   = $purchase_date ? "'" . mysqli_real_escape_string($conn, $purchase_date) . "'" : "NULL";

    $sql = "UPDATE assets SET name='$safeName', category='$safeCat', brand='$safeBrand', model='$safeModel', serial_number='$safeSN', purchase_date=$safeDate, purchase_price=$purchase_price, location='$safeLoc', `condition`='$safeCond', status='$safeStatus', description='$safeDesc', photo_path=" . ($photo_path ? "'$safePhoto'" : "NULL") . " WHERE id=$id";

    if (mysqli_query($conn, $sql)) {
        $safeUpdater = $updated_by > 0 ? $updated_by : "NULL";
        $action = 'update_kondisi';
        $notes  = 'Data aset diperbarui';
        $fromLoc = $old['location'];

        // Tentukan action type
        if ($old['location'] !== $new_location) {
            $action = 'pindah';
            $notes  = "Dipindahkan dari {$old['location']} ke {$new_location}";
        } elseif ($old['condition'] !== $new_condition) {
            $notes  = "Kondisi diperbarui: {$old['condition']} → {$new_condition}";
        } elseif ($old['status'] !== $new_status) {
            $action = 'update_kondisi';
            $notes  = "Status diperbarui: {$old['status']} → {$new_status}";
        }

        $safeFromLoc   = mysqli_real_escape_string($conn, $old['location']);
        $safeToLoc     = mysqli_real_escape_string($conn, $new_location);
        $safeCondBef   = mysqli_real_escape_string($conn, $old['condition']);
        $safeCondAft   = mysqli_real_escape_string($conn, $new_condition);
        $safeStatBef   = mysqli_real_escape_string($conn, $old['status']);
        $safeStatAft   = mysqli_real_escape_string($conn, $new_status);
        $safeNotes     = mysqli_real_escape_string($conn, $notes);

        mysqli_query($conn, "INSERT INTO asset_histories (asset_id, action_type, from_location, to_location, condition_before, condition_after, status_before, status_after, notes, performed_by) VALUES ($id, '$action', '$safeFromLoc', '$safeToLoc', '$safeCondBef', '$safeCondAft', '$safeStatBef', '$safeStatAft', '$safeNotes', $safeUpdater)");

        respond(200, ['status' => 'success', 'message' => 'Aset berhasil diperbarui']);
    } else {
        respond(500, ['status' => 'error', 'message' => 'Gagal memperbarui: ' . mysqli_error($conn)]);
    }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    if ($id <= 0) respond(400, ['status' => 'error', 'message' => 'ID tidak valid']);

    $old = mysqli_fetch_assoc(mysqli_query($conn, "SELECT photo_path FROM assets WHERE id=$id"));
    
    if (mysqli_query($conn, "DELETE FROM assets WHERE id=$id")) {
        // Hapus foto jika ada
        if (!empty($old['photo_path'])) {
            $filePath = __DIR__ . '/../uploads/' . $old['photo_path'];
            if (file_exists($filePath)) @unlink($filePath);
        }
        respond(200, ['status' => 'success', 'message' => 'Aset berhasil dihapus']);
    } else {
        respond(500, ['status' => 'error', 'message' => 'Gagal menghapus: ' . mysqli_error($conn)]);
    }
}

respond(405, ['status' => 'error', 'message' => 'Method not allowed']);
