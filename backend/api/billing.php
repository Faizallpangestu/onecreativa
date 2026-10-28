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

    // Siswa (calculate jmlInv and total on the fly)
    $res = mysqli_query($conn, "SELECT * FROM billing_siswa ORDER BY created_at DESC");
    $data['siswa'] = [];
    while ($r = mysqli_fetch_assoc($res)) {
        // count from invoices where customer = nama
        $cname = mysqli_real_escape_string($conn, $r['nama']);
        $cres = mysqli_query($conn, "SELECT COUNT(*) as jml, SUM(total) as tot FROM billing_invoices WHERE customer = '$cname'");
        $crow = mysqli_fetch_assoc($cres);
        $r['jmlInv'] = (int)$crow['jml'];
        $r['total'] = (float)$crow['tot'];
        $data['siswa'][] = $r;
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
