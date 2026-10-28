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
$actor=api_session_guard($conn,null);

$method = $_SERVER['REQUEST_METHOD'];
require_once __DIR__.'/../services/relationships.php';
if($method==='GET'&&($_GET['view']??'')==='receipt'){$row=ac_one($conn,'SELECT user_id,receipt_path FROM reimbursements WHERE id=?',[ac_id($_GET['id']??null)]);if(!$row)ac_fail('Struk tidak ditemukan.',404);if((int)$row['user_id']!==(int)$actor['id']&&!ac_can($conn,$actor,'read'))ac_fail('Struk pengguna lain tidak diizinkan.',403);rs_file('receipts',basename($row['receipt_path']??''),'receipts');}


function respond($statusCode, $payload) {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

// =======================
// GET: Ambil Data Klaim
// =======================
if ($method === 'GET') {
    $user_id = (int)$actor['id'];
    $role = $actor['role'];

    // Jika Finance / Admin, kembalikan semua data
    if (ac_can($conn,$actor,'read')) {
        $sql = "SELECT r.*, e.full_name as employee_name, e.employee_code 
                FROM reimbursements r 
                LEFT JOIN users u ON r.user_id = u.id 
                LEFT JOIN employees e ON u.id = e.user_id 
                ORDER BY r.created_at DESC";
        $query = mysqli_query($conn, $sql);
    } else {
        // Jika Karyawan biasa, kembalikan hanya miliknya
        if ($user_id === 0) {
            respond(400, ["status" => "error", "message" => "Missing user_id"]);
        }
        $sql = "SELECT * FROM reimbursements WHERE user_id = $user_id ORDER BY created_at DESC";
        $query = mysqli_query($conn, $sql);
    }

    $data = [];
    while ($row = mysqli_fetch_assoc($query)) {
        $data[] = $row;
    }
    respond(200, ["status" => "success", "data" => $data]);
}

// ==================================
// POST: Ajukan Klaim (Upload Foto)
// ==================================
if($method==='POST'){require_once __DIR__.'/../services/document_mutations.php';$result=dm_reimbursement($conn,$actor,$_POST);respond(201,['status'=>'success','message'=>'Klaim tersimpan dan menunggu review.','id'=>$result['id'],'data'=>$result]);}

if ($method === 'PUT') {
    try{
        ac_require($conn,$actor,'approve');$data=json_decode(file_get_contents('php://input'),true,512,JSON_THROW_ON_ERROR);$id=ac_id($data['id']??null);$status=$data['status']??'';if(!in_array($status,['approved','rejected'],true))ac_fail('Status keputusan tidak valid.');$notes=ac_text($data['finance_notes']??'','Catatan keputusan',2000,$status==='rejected');
        ac_atomic($conn,function()use($conn,$actor,$id,$status,$notes){$claim=ac_one($conn,'SELECT * FROM reimbursements WHERE id=? FOR UPDATE',[$id]);if(!$claim||$claim['status']!=='pending')ac_fail('Klaim tidak menunggu keputusan.',409);if((int)$claim['user_id']===(int)$actor['id'])ac_fail('Pengaju tidak boleh menyetujui sendiri.',403);ac_query($conn,'UPDATE reimbursements SET status=?,finance_notes=? WHERE id=?',[$status,$notes,$id]);if(ac_table($conn,'accounting_audit_logs'))ac_audit($conn,$actor,'reimbursement',(string)$id,$status,['note'=>$notes]);});
        respond(200,['status'=>'success','message'=>'Keputusan reimbursement tersimpan.']);
    }catch(AccountingException $e){respond($e->getCode(),['status'=>'error','message'=>$e->getMessage()]);}
    catch(JsonException $e){respond(400,['status'=>'error','message'=>'JSON tidak valid.']);}
    catch(Throwable $e){error_log('Reimbursement decision: '.$e->getMessage());respond(500,['status'=>'error','message'=>'Keputusan gagal disimpan.']);}
}

// Method tidak didukung
respond(405, ["status" => "error", "message" => "Method not allowed"]);
