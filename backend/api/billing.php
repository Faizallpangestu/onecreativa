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
$actor=api_session_guard($conn,$_SERVER['REQUEST_METHOD']==='GET'?'read':'prepare');

function respond($code, $payload) {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// Dummy data seeder removed to allow empty tables

if ($method === 'GET') {
    $data = [];
    
    // Invoices
    $res = mysqli_query($conn, "SELECT * FROM billing_invoices ORDER BY created_at DESC");
    $data['invoices'] = [];
    while ($r = mysqli_fetch_assoc($res)) {
        $r['total'] = $r['total'];
        $data['invoices'][] = $r;
    }

    // Terkirim
    $res = mysqli_query($conn, "SELECT * FROM billing_terkirim ORDER BY created_at DESC");
    $data['terkirim'] = [];
    while ($r = mysqli_fetch_assoc($res)) {
        $data['terkirim'][] = $r;
    }

    // Pembayaran
    $res = mysqli_query($conn, "SELECT * FROM billing_pembayaran ORDER BY created_at DESC");
    $data['pembayaran'] = [];
    while ($r = mysqli_fetch_assoc($res)) {
        $r['jumlah'] = $r['jumlah'];
        $r['sisa'] = $r['sisa'];
        $data['pembayaran'][] = $r;
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

    respond(200, ['status' => 'success', 'data' => $data]);
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);
    
    $action = $body['action'] ?? '';
    
    if ($action === 'add_invoice') {
        $id=ac_text($body['id']??'','Nomor invoice',50);$date=ac_date($body['tanggal']??'');$due=ac_date($body['jatuhTempo']??'');if($due<$date)ac_fail('Jatuh tempo harus setelah tanggal invoice.');
        $name=ac_text($body['customer']??'','Customer',255);$email=ac_text($body['email']??'','Email',255,false);if($email!==''&&!filter_var($email,FILTER_VALIDATE_EMAIL))ac_fail('Email tidak valid.');$phone=ac_text($body['phone']??'','Telepon',50,false);$description=ac_text($body['keterangan']??'','Keterangan',10000,false);
        $amount=ac_decimal(ac_cents(is_int($body['total']??null)?(string)$body['total']:($body['total']??'')));if($amount==='0.00')ac_fail('Nominal invoice harus positif.');
        $statusInput = $body['status'] ?? 'Unpaid';
        $statusVal = in_array($statusInput, ['Unpaid', 'Paid', 'Partially Paid', 'Overdue', 'Belum Lunas', 'Lunas', 'Sebagian']) ? $statusInput : 'Unpaid';
        $result=ac_atomic($conn,function()use($conn,$actor,$id,$date,$due,$name,$email,$phone,$description,$amount,$statusVal){
            ac_one($conn,'SELECT id FROM users WHERE id=? FOR UPDATE',[(int)$actor['id']]);$old=ac_one($conn,'SELECT * FROM billing_invoices WHERE id=? FOR UPDATE',[$id]);if($old){if($old['tanggal']!==$date||$old['jatuhTempo']!==$due||$old['customer']!==$name||$old['email']!==$email||$old['phone']!==$phone||$old['keterangan']!==$description||$old['total']!==$amount)ac_fail('Nomor invoice sudah digunakan untuk data berbeda.',409);return ['id'=>$id];}
            ac_query($conn,'INSERT INTO billing_invoices(id,tanggal,customer,email,phone,total,status,jatuhTempo,keterangan) VALUES(?,?,?,?,?,?,?, ?,?)',[$id,$date,$name,$email,$phone,$amount,$statusVal,$due,$description]);ac_audit($conn,$actor,'billing_invoice',$id,'created',['amount'=>$amount]);return ['id'=>$id];
        });respond(200,['status'=>'success','data'=>$result]);
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
    } elseif ($type === 'pembayaran') {
        mysqli_query($conn, "DELETE FROM billing_pembayaran WHERE id = '$idEsc' OR noInv = '$idEsc'");
    } elseif ($type === 'siswa') {
        mysqli_query($conn, "DELETE FROM billing_siswa WHERE id = '$idEsc' OR nama = '$idEsc'");
    }
    respond(200, ['status' => 'success', 'message' => 'Data berhasil dihapus']);
}

respond(405, ['status' => 'error']);
