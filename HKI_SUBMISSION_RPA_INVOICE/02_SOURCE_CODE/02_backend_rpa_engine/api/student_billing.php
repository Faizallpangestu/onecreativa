<?php
header('Content-Type: application/json; charset=utf-8');if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);exit;}
require_once __DIR__.'/../config/database.php';require_once __DIR__.'/../services/student_billing.php';
$a=rs_start($conn,['peserta_intensif','finance','finance_admin','admin','super_admin']);if(!ac_table($conn,'student_payment_submissions'))ac_fail('Migrasi bukti pembayaran belum tersedia.',503);$student=$a['role']==='peserta_intensif'?rs_student($conn,$a):null;if(!$student)sb_finance($conn,$a);
if($_SERVER['REQUEST_METHOD']==='GET'){
 if(isset($_GET['student_id'])&&$student&&(int)$_GET['student_id']!==(int)$student['id'])ac_fail('Tagihan siswa lain tidak diizinkan.',403);
 if(($_GET['view']??'')==='proof'){$proof=ac_one($conn,'SELECT * FROM student_payment_submissions WHERE id=?',[ac_id($_GET['id']??null)]);if(!$proof)ac_fail('Bukti tidak ditemukan.',404);if($student&&(int)$proof['student_id']!==(int)$student['id'])ac_fail('Bukti siswa lain tidak diizinkan.',403);rs_file('student_payments',$proof['proof_file']);}
 $links=ac_rows($conn,'SELECT * FROM student_invoice_links'.($student?' WHERE student_id='.(int)$student['id']:'').' ORDER BY id DESC');$bills=array_map(fn($r)=>sb_bill($conn,$r),$links);$receipts=ac_rows($conn,'SELECT id,invoice_link_id,student_id,amount,transfer_date,reference,status,transaction_id,review_notes,reviewed_at FROM student_payment_submissions'.($student?' WHERE student_id='.(int)$student['id']:'').' ORDER BY id DESC');$data=['bills'=>$bills,'submissions'=>$receipts,'can_prepare'=>!$student&&ac_can($conn,$a,'prepare'),'can_review'=>!$student&&ac_can($conn,$a,'post')];
 if(!$student){$data['students']=ac_rows($conn,"SELECT p.id,p.nama_lengkap AS name FROM peserta_intensif p JOIN users u ON u.id=p.user_id JOIN roles r ON r.id=u.role_id WHERE u.is_active=1 AND r.name='peserta_intensif' ORDER BY p.nama_lengkap");$data['invoices']=ac_rows($conn,"SELECT id,customer AS name,'billing_invoice' AS source_type FROM billing_invoices UNION ALL SELECT CAST(id AS CHAR),name,'invoice_client' FROM invoice_clients");}ed_respond(200,['status'=>'success','data'=>$data]);
}
if($_SERVER['REQUEST_METHOD']==='DELETE'){
 $id=isset($_GET['id'])?ac_id($_GET['id']):null;
 $result=sb_delete_student($conn,$a,['id'=>$id]);
 ed_respond(200,['status'=>'success','message'=>'Data siswa berhasil dihapus.','data'=>$result]);
}
if($_SERVER['REQUEST_METHOD']==='POST'){$d=json_decode(file_get_contents('php://input'),true)??$_POST;if(!is_array($d))ac_fail('Data tidak valid.');$result=match($d['action']??'submit'){'link'=>sb_link($conn,$a,$d),'review'=>sb_review($conn,$a,$d),'submit'=>sb_submit($conn,$a,$d),'delete_student'=>sb_delete_student($conn,$a,$d),'update_student'=>sb_update_student($conn,$a,$d),'create_student'=>sb_create_student($conn,$a,$d),default=>ac_fail('Aksi tidak dikenal.')};ed_respond(200,['status'=>'success','data'=>$result]);}
ac_fail('Metode tidak diizinkan.',405);
