<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/api_session_guard.php';
require_once __DIR__.'/../services/rpa_automation.php';
$actor=api_session_guard($conn,$_SERVER['REQUEST_METHOD']==='GET'?'read':'prepare');

function respond($code, $payload) {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

function billing_ensure_proof_column($conn) {
    try {
        $column = mysqli_query($conn, "SHOW COLUMNS FROM billing_pembayaran LIKE 'proof_path'");
    } catch (Throwable $error) {
        error_log('Billing proof schema check: ' . $error->getMessage());
        respond(500, ['status' => 'error', 'message' => 'Kolom bukti pembayaran gagal diperiksa.']);
    }
    if (!$column) respond(500, ['status' => 'error', 'message' => 'Kolom bukti pembayaran gagal diperiksa.']);
    if (mysqli_num_rows($column) > 0) return;

    try {
        mysqli_query($conn, 'ALTER TABLE billing_pembayaran ADD COLUMN proof_path VARCHAR(255) NULL');
    } catch (Throwable $error) {
        error_log('Billing proof schema update: ' . $error->getMessage());
    }

    try {
        $column = mysqli_query($conn, "SHOW COLUMNS FROM billing_pembayaran LIKE 'proof_path'");
    } catch (Throwable $error) {
        error_log('Billing proof schema verification: ' . $error->getMessage());
        respond(500, ['status' => 'error', 'message' => 'Kolom penyimpanan bukti pembayaran belum tersedia.']);
    }
    if (!$column || mysqli_num_rows($column) === 0) {
        respond(500, ['status' => 'error', 'message' => 'Kolom penyimpanan bukti pembayaran belum tersedia.']);
    }
}

function billing_ensure_meta_column($conn) {
    try {
        $column = mysqli_query($conn, "SHOW COLUMNS FROM billing_invoices LIKE 'meta_json'");
        if ($column && mysqli_num_rows($column) === 0) {
            @mysqli_query($conn, 'ALTER TABLE billing_invoices ADD COLUMN meta_json LONGTEXT NULL');
        }
    } catch (Throwable $error) {
        error_log('Billing meta_json schema check: ' . $error->getMessage());
    }
}

function billing_store_payment_proof($upload) {
    if (!$upload || ($upload['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) return null;
    if (($upload['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK || !is_uploaded_file($upload['tmp_name'] ?? '')) {
        ac_fail('Foto bukti pembayaran gagal diunggah.');
    }

    $size = filesize($upload['tmp_name']);
    if ($size === false || $size < 1 || $size > 5 * 1024 * 1024) ac_fail('Bukti pembayaran maksimal 5 MB.');

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($upload['tmp_name']);
    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'application/pdf' => 'pdf',
    ];
    if (!isset($extensions[$mime])) ac_fail('Bukti harus berupa foto JPG, PNG, WebP, atau PDF.');
    if (str_starts_with($mime, 'image/') && !getimagesize($upload['tmp_name'])) {
        ac_fail('File foto bukti tidak valid atau rusak.');
    }

    $directory = __DIR__ . '/../uploads/payment_proofs';
    if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
        ac_fail('Folder penyimpanan bukti pembayaran tidak tersedia.', 500);
    }
    $filename = bin2hex(random_bytes(16)) . '.' . $extensions[$mime];
    if (!move_uploaded_file($upload['tmp_name'], $directory . '/' . $filename)) {
        ac_fail('Foto bukti pembayaran gagal disimpan.', 500);
    }
    return 'payment_proofs/' . $filename;
}

function billing_remove_payment_proof($relativePath) {
    if (!preg_match('#^payment_proofs/[a-f0-9]{32}\.(jpg|png|webp|pdf)$#D', (string)$relativePath)) return;
    $file = __DIR__ . '/../uploads/' . basename($relativePath);
    if (is_file($file)) unlink($file);
}

$method = $_SERVER['REQUEST_METHOD'];

// Dummy data seeder removed to allow empty tables

if ($method === 'GET') {
    billing_ensure_proof_column($conn);
    billing_ensure_meta_column($conn);
    rpa_ensure_billing_columns($conn);
    rpa_ensure_automation_logs_table($conn);

    if (($_GET['view'] ?? '') === 'payment_proof') {
        $paymentId = ac_id($_GET['id'] ?? null, 'ID pembayaran');
        $payment = ac_one($conn, 'SELECT proof_path FROM billing_pembayaran WHERE id=?', [$paymentId]);
        $relativePath = (string)($payment['proof_path'] ?? '');
        if (!preg_match('#^payment_proofs/[a-f0-9]{32}\.(jpg|png|webp|pdf)$#D', $relativePath)) {
            respond(404, ['status' => 'error', 'message' => 'File bukti pembayaran tidak ditemukan.']);
        }

        $directory = realpath(__DIR__ . '/../uploads/payment_proofs');
        $file = $directory ? realpath($directory . DIRECTORY_SEPARATOR . basename($relativePath)) : false;
        if (!$file || !is_file($file) || strpos($file, $directory . DIRECTORY_SEPARATOR) !== 0) {
            respond(404, ['status' => 'error', 'message' => 'File bukti pembayaran tidak ditemukan.']);
        }

        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file);
        if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], true)) {
            respond(415, ['status' => 'error', 'message' => 'Jenis file bukti pembayaran tidak didukung.']);
        }
        header('Content-Type: ' . $mime);
        header('Content-Disposition: inline; filename="' . basename($file) . '"');
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: private, max-age=3600');
        readfile($file);
        exit;
    }

    $data = [];

    // Load payments first so invoice balances/statuses can be derived from
    // the persisted, verified payment records below.
    $res = mysqli_query($conn, "SELECT * FROM billing_pembayaran ORDER BY created_at DESC");
    $data['pembayaran'] = [];
    $verifiedPaymentTotals = [];
    $latestVerifiedPaymentIdByInv = [];
    while ($r = mysqli_fetch_assoc($res)) {
        $proofPath = (string)($r['proof_path'] ?? '');
        $proofExtension = strtolower(pathinfo($proofPath, PATHINFO_EXTENSION));
        $r['proof_url'] = $proofPath !== ''
            ? '/api/billing.php?view=payment_proof&id=' . rawurlencode((string)$r['id'])
            : '';
        $r['proof_mime'] = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'pdf' => 'application/pdf'][$proofExtension] ?? '';
        $r['buktiBayar'] = $r['proof_url'];
        $r['buktiMime'] = $r['proof_mime'];
        unset($r['proof_path']);
        $data['pembayaran'][] = $r;
        if (in_array(strtolower(trim((string)($r['statusVerif'] ?? ''))), ['terverifikasi', 'verified'], true) && !empty($r['noInv'])) {
            $invoiceId = (string)$r['noInv'];
            if (!isset($latestVerifiedPaymentIdByInv[$invoiceId])) {
                $latestVerifiedPaymentIdByInv[$invoiceId] = (int)$r['id'];
            }
            $verifiedPaymentTotals[$invoiceId] = ac_add(
                $verifiedPaymentTotals[$invoiceId] ?? 0,
                ac_cents((string)($r['jumlah'] ?? '0'))
            );
        }
    }
    
    // Invoices
    $res = mysqli_query($conn, "SELECT * FROM billing_invoices ORDER BY created_at DESC");
    $data['invoices'] = [];
    while ($r = mysqli_fetch_assoc($res)) {
        $decodedMeta = null;
        if (!empty($r['meta_json'])) {
            $decodedMeta = json_decode((string)$r['meta_json'], true);
            if (is_array($decodedMeta)) {
                foreach (['skema', 'program', 'lokasi', 'durasi', 'salesCode', 'subtotal', 'discount', 'items', 'installments', 'includes', 'excludes', 'notes', 'bank_name', 'account_number', 'account_holder', 'midtrans_last'] as $metaKey) {
                    if (array_key_exists($metaKey, $decodedMeta) && !isset($r[$metaKey])) {
                        $r[$metaKey] = $decodedMeta[$metaKey];
                    }
                }
            }
        }
        unset($r['meta_json']);
        $total = ac_cents((string)($r['total'] ?? '0'));
        $paid = $verifiedPaymentTotals[$r['id']] ?? 0;
        if ($paid > 0) {
            $paid = min($paid, $total);
            $r['status'] = $paid >= $total ? 'Paid' : 'Partially Paid';
        } elseif (in_array(strtolower(trim((string)($r['status'] ?? ''))), ['paid', 'lunas'], true)) {
            $paid = $total;
            $r['status'] = 'Paid';
        }
        $r['terbayar'] = ac_decimal($paid);
        $r['sisa'] = ac_decimal(max(0, $total - $paid));
        $pubTok = trim((string)($r['public_token'] ?? ''));
        if ($pubTok === '') {
            $pubTok = rpa_ensure_invoice_token($conn, (string)$r['id']);
            $r['public_token'] = $pubTok;
        }
        $latestPayId = $latestVerifiedPaymentIdByInv[(string)$r['id']] ?? null;
        $rpaUrls = $pubTok !== '' ? rpa_build_public_urls((string)$r['id'], $pubTok, $latestPayId) : null;
        if ($rpaUrls) {
            $r['invoice_url'] = $rpaUrls['invoice_url'];
            $r['status_url'] = $rpaUrls['status_url'];
            $r['receipt_url'] = ($latestPayId || $paid > 0) ? $rpaUrls['receipt_url'] : '';
        }
        $data['invoices'][] = $r;
    }

    // Terkirim
    $res = mysqli_query($conn, "SELECT * FROM billing_terkirim ORDER BY created_at DESC");
    $data['terkirim'] = [];
    while ($r = mysqli_fetch_assoc($res)) {
        $data['terkirim'][] = $r;
    }

    // Siswa (Union peserta_intensif dan billing_siswa dengan penghitungan invoice aktif)
    $data['siswa'] = [];
    try {
        $pCols = [];
        $hasPeserta = false;
        $chk = mysqli_query($conn, "SHOW TABLES LIKE 'peserta_intensif'");
        if ($chk && mysqli_num_rows($chk) > 0) {
            $hasPeserta = true;
            $cRes = mysqli_query($conn, "SHOW COLUMNS FROM peserta_intensif");
            if ($cRes) {
                while ($cRow = mysqli_fetch_assoc($cRes)) {
                    $pCols[] = strtolower($cRow['Field']);
                }
            }
            // Auto self-heal: Tambahkan kolom yang belum ada jika tabel lama
            $missingCols = [
                'nis' => "VARCHAR(50) NULL",
                'program' => "VARCHAR(150) DEFAULT 'Program Pelatihan Jepang'",
                'kota' => "VARCHAR(100) DEFAULT 'Cianjur'",
                'source' => "VARCHAR(50) DEFAULT 'manual'",
                'status' => "VARCHAR(50) DEFAULT 'Aktif'"
            ];
            foreach ($missingCols as $col => $def) {
                if (!in_array($col, $pCols, true)) {
                    @mysqli_query($conn, "ALTER TABLE peserta_intensif ADD COLUMN `$col` $def");
                    $pCols[] = $col;
                }
            }
        }

        if ($hasPeserta) {
            $selNis = in_array('nis', $pCols, true) ? "p.nis" : "'' AS nis";
            $selProg = in_array('program', $pCols, true) ? "p.program" : "'Program Pelatihan Jepang' AS program";
            $selKota = in_array('kota', $pCols, true) ? "p.kota" : "'Cianjur' AS kota";
            $selStatus = in_array('status', $pCols, true) ? "p.status" : "'Aktif' AS status";
            $selSource = in_array('source', $pCols, true) ? "p.source" : "'manual' AS source";
            $selPhone = in_array('no_wa', $pCols, true) ? "p.no_wa AS phone" : (in_array('phone', $pCols, true) ? "p.phone" : "'' AS phone");
            $selEmail = in_array('email', $pCols, true) ? "p.email" : "'' AS email";
            $selName = in_array('nama_lengkap', $pCols, true) ? "p.nama_lengkap AS nama" : (in_array('nama', $pCols, true) ? "p.nama" : "'Siswa' AS nama");

            $sql = "
                SELECT p.id, $selName, $selPhone, $selEmail, $selNis, $selProg, $selKota, $selStatus, $selSource,
                       COALESCE((SELECT COUNT(*) FROM billing_invoices bi WHERE bi.customer = $selName), 0) AS jmlInv,
                       COALESCE((SELECT SUM(bi.total) FROM billing_invoices bi WHERE bi.customer = $selName), 0) AS total
                FROM peserta_intensif p
            ";

            $hasBillingSiswa = false;
            $chkBs = mysqli_query($conn, "SHOW TABLES LIKE 'billing_siswa'");
            if ($chkBs && mysqli_num_rows($chkBs) > 0) {
                $hasBillingSiswa = true;
                $sql .= "
                    UNION
                    SELECT b.id, b.nama, COALESCE(b.telp, '') AS phone, COALESCE(b.email, '') AS email, '' AS nis, 'Kelas Reguler' AS program, 'Cianjur' AS kota, COALESCE(b.status, 'Aktif') AS status, 'manual' AS source,
                           COALESCE((SELECT COUNT(*) FROM billing_invoices bi WHERE bi.customer = b.nama), 0) AS jmlInv,
                           COALESCE((SELECT SUM(bi.total) FROM billing_invoices bi WHERE bi.customer = b.nama), 0) AS total
                    FROM billing_siswa b
                    WHERE NOT EXISTS (SELECT 1 FROM peserta_intensif p2 WHERE p2.nama_lengkap = b.nama)
                ";
            }
            $sql .= " ORDER BY nama ASC";

            $res = mysqli_query($conn, $sql);
            if ($res) {
                while ($r = mysqli_fetch_assoc($res)) {
                    $r['jmlInv'] = (int)$r['jmlInv'];
                    $r['total'] = (float)$r['total'];
                    $data['siswa'][] = $r;
                }
            }
        }
    } catch (Throwable $e) {
        error_log('Error loading siswa for billing: ' . $e->getMessage());
    }

    $data['automation_logs'] = [];
    $aRes = @mysqli_query($conn, "SELECT id, invoice_id, stage, channel, status, recipient, detail_json, error_message, created_at FROM automation_logs ORDER BY id DESC LIMIT 120");
    if ($aRes) {
        while ($ar = mysqli_fetch_assoc($aRes)) {
            $ar['detail'] = !empty($ar['detail_json']) ? (json_decode((string)$ar['detail_json'], true) ?: []) : [];
            unset($ar['detail_json']);
            $data['automation_logs'][] = $ar;
        }
    }

    $mtCfg = rpa_get_midtrans_config();
    $data['rpa_status'] = [
        'midtrans_enabled' => $mtCfg['is_configured'],
        'midtrans_is_production' => $mtCfg['is_production'],
        'n8n_receipt_configured' => rpa_get_receipt_webhook_url() !== '',
    ];

    respond(200, ['status' => 'success', 'data' => $data]);
}

if ($method === 'POST') {
    billing_ensure_proof_column($conn);
    billing_ensure_meta_column($conn);
    $isMultipart = str_contains((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'multipart/form-data');
    $body = $isMultipart ? $_POST : json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) $body = [];
    
    $action = $body['action'] ?? '';

    if ($action === 'attach_payment_proof') {
        $paymentId = ac_id($body['payment_id'] ?? null, 'ID pembayaran');
        $newProofPath = billing_store_payment_proof($_FILES['proof'] ?? null);
        if (!$newProofPath) ac_fail('Pilih foto bukti yang akan disimpan.');

        $oldProofPath = '';
        try {
            ac_atomic($conn, function () use ($conn, $actor, $paymentId, $newProofPath, &$oldProofPath) {
                $payment = ac_one($conn, 'SELECT * FROM billing_pembayaran WHERE id=? FOR UPDATE', [$paymentId]);
                if (!$payment) ac_fail('Pembayaran tidak ditemukan.', 404);
                $oldProofPath = (string)($payment['proof_path'] ?? '');
                ac_query($conn, 'UPDATE billing_pembayaran SET proof_path=? WHERE id=?', [$newProofPath, $paymentId]);
                ac_audit($conn, $actor, 'billing_payment', (string)$paymentId, 'proof_attached', [
                    'invoice_id' => (string)($payment['noInv'] ?? ''),
                    'replaced_existing' => $oldProofPath !== ''
                ]);
            });
        } catch (Throwable $e) {
            billing_remove_payment_proof($newProofPath);
            throw $e;
        }

        billing_remove_payment_proof($oldProofPath);
        $extension = strtolower(pathinfo($newProofPath, PATHINFO_EXTENSION));
        $mime = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'pdf' => 'application/pdf'][$extension] ?? '';
        respond(200, ['status' => 'success', 'data' => [
            'payment_id' => $paymentId,
            'proof_url' => '/api/billing.php?view=payment_proof&id=' . $paymentId,
            'proof_mime' => $mime
        ]]);
    }

    if ($action === 'add_invoice') {
        $id=ac_text($body['id']??'','Nomor invoice',50);$date=ac_date($body['tanggal']??'');$due=ac_date($body['jatuhTempo']??'');if($due<$date)ac_fail('Jatuh tempo harus setelah tanggal invoice.');
        $name=ac_text($body['customer']??'','Customer',255);$email=ac_text($body['email']??'','Email',255,false);if($email!==''&&!filter_var($email,FILTER_VALIDATE_EMAIL))ac_fail('Email tidak valid.');$phone=ac_text($body['phone']??'','Telepon',50,false);$description=ac_text($body['keterangan']??'','Keterangan',10000,false);
        $amount=ac_decimal(ac_cents(is_int($body['total']??null)?(string)$body['total']:($body['total']??'')));if($amount==='0.00')ac_fail('Nominal invoice harus positif.');
        $statusInput = $body['status'] ?? 'Unpaid';
        $statusVal = in_array($statusInput, ['Unpaid', 'Paid', 'Partially Paid', 'Overdue', 'Belum Lunas', 'Lunas', 'Sebagian']) ? $statusInput : 'Unpaid';
        $metaPayload = [];
        foreach (['skema', 'program', 'lokasi', 'durasi', 'salesCode', 'subtotal', 'discount', 'items', 'installments', 'includes', 'excludes', 'notes', 'bank_name', 'account_number', 'account_holder'] as $metaKey) {
            if (array_key_exists($metaKey, $body)) {
                $metaPayload[$metaKey] = $body[$metaKey];
            }
        }
        $metaJson = !empty($metaPayload) ? json_encode($metaPayload, JSON_UNESCAPED_UNICODE) : null;
        $hasMetaCol = false;
        $metaColRes = mysqli_query($conn, "SHOW COLUMNS FROM billing_invoices LIKE 'meta_json'");
        if ($metaColRes && mysqli_num_rows($metaColRes) > 0) $hasMetaCol = true;
        $result=ac_atomic($conn,function()use($conn,$actor,$id,$date,$due,$name,$email,$phone,$description,$amount,$statusVal,$metaJson,$hasMetaCol){
            ac_one($conn,'SELECT id FROM users WHERE id=? FOR UPDATE',[(int)$actor['id']]);$old=ac_one($conn,'SELECT * FROM billing_invoices WHERE id=? FOR UPDATE',[$id]);if($old){if($old['tanggal']!==$date||$old['jatuhTempo']!==$due||$old['customer']!==$name||$old['email']!==$email||$old['phone']!==$phone||$old['keterangan']!==$description||$old['total']!==$amount)ac_fail('Nomor invoice sudah digunakan untuk data berbeda.',409);return ['id'=>$id];}
            if ($hasMetaCol) {
                ac_query($conn,'INSERT INTO billing_invoices(id,tanggal,customer,email,phone,total,status,jatuhTempo,keterangan,meta_json) VALUES(?,?,?,?,?,?,?,?,?,?)',[$id,$date,$name,$email,$phone,$amount,$statusVal,$due,$description,$metaJson]);
            } else {
                ac_query($conn,'INSERT INTO billing_invoices(id,tanggal,customer,email,phone,total,status,jatuhTempo,keterangan) VALUES(?,?,?,?,?,?,?, ?,?)',[$id,$date,$name,$email,$phone,$amount,$statusVal,$due,$description]);
            }
            ac_audit($conn,$actor,'billing_invoice',$id,'created',['amount'=>$amount]);return ['id'=>$id];
        });respond(200,['status'=>'success','data'=>$result]);
    }

    if ($action === 'approve_payment') {
        $invoiceId = ac_text($body['invoice_id'] ?? '', 'Nomor invoice', 50);
        $paymentDate = ac_date($body['tglBayar'] ?? '');
        $amount = ac_decimal(ac_cents((string)($body['jumlah'] ?? '')));
        if ($amount === '0.00') ac_fail('Nominal pembayaran harus lebih dari nol.');
        $method = ac_text($body['metode'] ?? 'Transfer Bank', 'Metode pembayaran', 50);
        $customer = ac_text($body['customer'] ?? '', 'Nama pembayar', 255);

        $conn->begin_transaction();
        $proofPath = null;
        try {
            $invoice = ac_one($conn, 'SELECT * FROM billing_invoices WHERE id=? FOR UPDATE', [$invoiceId]);
            if (!$invoice) ac_fail('Invoice tidak ditemukan.', 404);

            $payments = ac_rows($conn, "SELECT jumlah,statusVerif FROM billing_pembayaran WHERE noInv=? FOR UPDATE", [$invoiceId]);
            $total = ac_cents((string)$invoice['total']);
            $paid = 0;
            foreach ($payments as $payment) {
                if (in_array(strtolower(trim((string)$payment['statusVerif'])), ['terverifikasi', 'verified'], true)) {
                    $paid = ac_add($paid, ac_cents((string)$payment['jumlah']));
                }
            }
            if ($paid === 0 && in_array(strtolower(trim((string)$invoice['status'])), ['paid', 'lunas'], true)) {
                $paid = $total;
            }
            $outstanding = max(0, $total - $paid);
            $amountCents = ac_cents($amount);
            if ($amountCents > $outstanding) ac_fail('Nominal pembayaran melebihi sisa tagihan.', 409);

            $newPaid = ac_add($paid, $amountCents);
            $remaining = max(0, $total - $newPaid);
            $status = $remaining === 0 ? 'Paid' : 'Partially Paid';
            $proofPath = billing_store_payment_proof($_FILES['proof'] ?? null);
            ac_query($conn, "INSERT INTO billing_pembayaran(noInv,tglBayar,customer,metode,jumlah,sisa,statusVerif,proof_path) VALUES(?,?,?,?,?,?, 'Terverifikasi',?)",
                [$invoiceId, $paymentDate, $customer, $method, $amount, ac_decimal($remaining), $proofPath]);
            $paymentId = (int)$conn->insert_id;
            ac_query($conn, 'UPDATE billing_invoices SET status=? WHERE id=?', [$status, $invoiceId]);
            ac_audit($conn, $actor, 'billing_payment', (string)$paymentId, 'verified', [
                'invoice_id' => $invoiceId,
                'amount' => $amount,
                'remaining' => ac_decimal($remaining),
                'status' => $status
            ]);
            $conn->commit();
        } catch (Throwable $e) {
            $conn->rollback();
            if ($proofPath) billing_remove_payment_proof($proofPath);
            throw $e;
        }

        // Phase 2 RPA: Siapkan token, nomor receipt, dokumen resmi, dan picu n8n jika dikonfigurasi
        $amtNumeric = (float)$amount;
        $paidTotalNumeric = (float)ac_decimal($newPaid);
        $remNumeric = (float)ac_decimal($remaining);
        $receiptAuto = rpa_trigger_receipt_automation(
            $conn,
            $invoice,
            $paymentId,
            $amtNumeric,
            $paidTotalNumeric,
            $remNumeric,
            $status,
            $paymentDate,
            $method,
            $customer
        );
        $urls = $receiptAuto['urls'];

        respond(200, [
            'status' => 'success',
            'data' => [
                'payment_id' => $paymentId,
                'receipt_number' => $receiptAuto['receipt_number'],
                'invoice_id' => $invoiceId,
                'status' => $status,
                'terbayar' => ac_decimal($newPaid),
                'sisa' => ac_decimal($remaining),
                'receipt_url' => $urls['receipt_url'],
                'invoice_url' => $urls['invoice_url'],
                'status_url' => $urls['status_url'],
                'rpa_dispatched' => $receiptAuto['rpa_dispatched'],
                'proof_url' => $proofPath ? '/api/billing.php?view=payment_proof&id=' . $paymentId : '',
                'proof_mime' => $proofPath ? (['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'pdf' => 'application/pdf'][strtolower(pathinfo($proofPath, PATHINFO_EXTENSION))] ?? '') : ''
            ]
        ]);
    }
    
    respond(400, ['status' => 'error', 'message' => 'Aksi belum didukung. Tidak ada data yang disimpan.']);
}

if ($method === 'DELETE') {
    $type = $_GET['type'] ?? 'invoice';
    $id = $_GET['id'] ?? '';
    if (!$id) {
        respond(400, ['status' => 'error', 'message' => 'ID wajib disertakan.']);
    }
    $idEsc = mysqli_real_escape_string($conn, $id);
    if ($type === 'invoice') {
        mysqli_query($conn, "DELETE FROM billing_invoices WHERE id = '$idEsc'");
        ac_audit($conn, $actor, 'billing_invoice', $id, 'deleted', []);
    } elseif ($type === 'terkirim') {
        mysqli_query($conn, "DELETE FROM billing_terkirim WHERE id = '$idEsc'");
    } elseif ($type === 'pembayaran' && ($_GET['scope'] ?? '') === 'single') {
        billing_ensure_proof_column($conn);
        $paymentId = ac_id($id, 'ID pembayaran');
        $proofPathToDelete = '';
        ac_atomic($conn, function () use ($conn, $actor, $paymentId, &$proofPathToDelete) {
            $payment = ac_one($conn, 'SELECT * FROM billing_pembayaran WHERE id=? FOR UPDATE', [$paymentId]);
            if (!$payment) ac_fail('Pembayaran tidak ditemukan.', 404);
            $proofPathToDelete = (string)($payment['proof_path'] ?? '');
            $invoiceId = (string)($payment['noInv'] ?? '');
            $invoice = $invoiceId !== '' ? ac_one($conn, 'SELECT * FROM billing_invoices WHERE id=? FOR UPDATE', [$invoiceId]) : null;
            if (ac_table($conn, 'accounting_transactions') && ac_one($conn, "SELECT id FROM accounting_transactions WHERE source_type='billing_payment' AND source_id=? AND approval_status<>'cancelled' AND journal_status<>'reversed' LIMIT 1", [(string)$paymentId])) {
                ac_fail('Pembayaran sudah terhubung ke transaksi akuntansi. Batalkan transaksi akuntansinya sebelum menghapus.', 409);
            }

            ac_query($conn, 'DELETE FROM billing_pembayaran WHERE id=?', [$paymentId]);
            if ($invoice) {
                $verifiedRows = ac_rows($conn, "SELECT jumlah FROM billing_pembayaran WHERE noInv=? AND LOWER(TRIM(statusVerif)) IN ('terverifikasi','verified')", [$invoiceId]);
                $paid = 0;
                foreach ($verifiedRows as $row) {
                    $paid = ac_add($paid, ac_cents((string)$row['jumlah']));
                }
                $total = ac_cents((string)$invoice['total']);
                $status = $paid >= $total ? 'Paid' : ($paid > 0 ? 'Partially Paid' : 'Unpaid');
                ac_query($conn, 'UPDATE billing_invoices SET status=? WHERE id=?', [$status, $invoiceId]);
            }
            ac_audit($conn, $actor, 'billing_payment', (string)$paymentId, 'deleted', [
                'invoice_id' => $invoiceId,
                'amount' => (string)$payment['jumlah']
            ]);
        });
        billing_remove_payment_proof($proofPathToDelete);
    } elseif ($type === 'pembayaran') {
        mysqli_query($conn, "DELETE FROM billing_pembayaran WHERE id = '$idEsc' OR noInv = '$idEsc'");
    } elseif ($type === 'siswa') {
        mysqli_query($conn, "DELETE FROM billing_siswa WHERE id = '$idEsc' OR nama = '$idEsc'");
    }
    respond(200, ['status' => 'success', 'message' => 'Data berhasil dihapus']);
}

respond(405, ['status' => 'error']);
