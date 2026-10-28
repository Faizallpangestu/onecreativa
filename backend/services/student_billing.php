<?php
require_once __DIR__.'/relationships.php';
function sb_finance(mysqli $db,array $a,string $permission='read'):void{ac_require($db,$a,$permission);}
function sb_bill(mysqli $db,array $link):array{
 $type=$link['billing_invoice_id']!==null?'billing_invoice':'invoice_client';$source=(string)($link['billing_invoice_id']??$link['invoice_client_id']);
 $row=$type==='billing_invoice'?ac_one($db,'SELECT id,total AS amount,customer AS title,jatuhTempo AS due_date,status AS original_status FROM billing_invoices WHERE id=?',[$source]):ac_one($db,'SELECT id,total_biaya AS amount,name AS title,NULL AS due_date,NULL AS original_status FROM invoice_clients WHERE id=?',[(int)$source]);if(!$row)ac_fail('Dokumen sumber tidak ditemukan.',409);
 $doc=ac_one($db,'SELECT id,journal_entry_id,amount FROM accounting_source_documents WHERE source_type=? AND source_id=?',[$type,$source]);$cancelled=in_array(strtolower($row['original_status']??''),['cancelled','canceled','dibatalkan','batal'],true)||($doc&&ac_one($db,'SELECT id FROM journal_entries WHERE reversal_of=?',[(int)$doc['journal_entry_id']]));
 $payments=$doc?ac_rows($db,"SELECT t.id AS transaction_id,t.number,t.transaction_date,t.reference,pa.amount FROM payment_allocations pa JOIN accounting_transactions t ON t.id=pa.transaction_id JOIN journal_entries j ON j.id=t.journal_entry_id WHERE pa.source_document_id=? AND pa.is_reversed=0 AND t.payment_status='verified' AND t.journal_status='posted' AND j.status='posted' ORDER BY t.transaction_date,t.id",[(int)$doc['id']]):[];
 $total=ac_cents($row['amount']);if($doc&&ac_cents($doc['amount'])!==$total)ac_fail('Nominal dokumen sumber berubah setelah pengakuan. Rekonsiliasi Finance diperlukan.',409);$paid=0;foreach($payments as $payment)$paid=ac_add($paid,ac_cents($payment['amount']));$total=ac_cents($row['amount']);if($paid>$total)ac_fail('Saldo invoice perlu direkonsiliasi Finance.',409);
 return ['id'=>(int)$link['id'],'student_id'=>(int)$link['student_id'],'source_type'=>$type,'source_id'=>$source,'title'=>$row['title'],'due_date'=>$row['due_date'],'amount'=>ac_decimal($total),'paid'=>ac_decimal($paid),'outstanding'=>ac_decimal($cancelled?0:$total-$paid),'cancelled'=>(bool)$cancelled,'recognized'=>(bool)$doc,'status'=>$cancelled?'cancelled':($total===$paid?'paid':($paid?'partial':'unpaid')),'payments'=>$payments];
}
function sb_link(mysqli $db,array $a,array $d):array{
 sb_finance($db,$a,'prepare');return ac_atomic($db,function()use($db,$a,$d){ac_one($db,'SELECT id FROM users WHERE id=? FOR UPDATE',[(int)$a['id']]);$student=ac_id($d['student_id']??null);if(!ac_one($db,"SELECT p.id FROM peserta_intensif p JOIN users u ON u.id=p.user_id JOIN roles r ON r.id=u.role_id WHERE p.id=? AND u.is_active=1 AND r.name='peserta_intensif'",[$student]))ac_fail('Siswa belum terhubung ke akun aktif.');$billing=$d['billing_invoice_id']??null;$client=isset($d['invoice_client_id'])?ac_id($d['invoice_client_id']):null;if(($billing!==null)+($client!==null)!==1)ac_fail('Pilih satu jenis dokumen invoice.');if($billing!==null)$billing=ac_text($billing,'Invoice',50);$link=['student_id'=>$student,'billing_invoice_id'=>$billing,'invoice_client_id'=>$client];sb_bill($db,$link+['id'=>0]);$old=ac_one($db,'SELECT id,student_id FROM student_invoice_links WHERE billing_invoice_id=? OR invoice_client_id=? FOR UPDATE',[$billing,$client]);if($old){if((int)$old['student_id']!==$student)ac_fail('Invoice telah memiliki pemilik lain; koreksi memerlukan review.',409);return ['id'=>(int)$old['id']];}ac_query($db,'INSERT INTO student_invoice_links(student_id,billing_invoice_id,invoice_client_id,linked_by) VALUES(?,?,?,?)',[$student,$billing,$client,(int)$a['id']]);$id=$db->insert_id;rs_audit($db,$a,'student_invoice_link',$id,'created',['student_id'=>$student,'source_type'=>$billing!==null?'billing_invoice':'invoice_client']);return ['id'=>$id];});
}
function sb_submit(mysqli $db,array $a,array $d):array{
 if($a['role']!=='peserta_intensif')ac_fail('Bukti pembayaran hanya dari akun siswa.',403);$student=rs_student($db,$a);
 return ac_atomic($db,function()use($db,$a,$d,$student){ac_one($db,'SELECT id FROM users WHERE id=? FOR UPDATE',[(int)$a['id']]);$link=ac_one($db,'SELECT * FROM student_invoice_links WHERE id=? AND student_id=? FOR UPDATE',[ac_id($d['invoice_link_id']??null),(int)$student['id']]);if(!$link)ac_fail('Invoice bukan milik siswa ini.',403);$amount=ac_cents($d['amount']??'');$bill=sb_bill($db,$link);if(!$amount||$amount>ac_cents($bill['outstanding'])||$bill['cancelled'])ac_fail('Nominal melebihi outstanding invoice atau invoice dibatalkan.',409);$date=ac_date($d['transfer_date']??'');$ref=ac_text($d['reference']??'','Referensi transfer',180);$key=ac_key($d['request_key']??'');$existing=ac_one($db,'SELECT * FROM student_payment_submissions WHERE request_key=? FOR UPDATE',[$key]);if($existing){if((int)$existing['student_id']!==(int)$student['id']||(int)$existing['invoice_link_id']!==(int)$link['id']||ac_cents($existing['amount'])!==$amount||$existing['transfer_date']!==$date||$existing['reference']!==$ref)ac_fail('Key permintaan telah dipakai untuk data berbeda.',409);return ['id'=>(int)$existing['id'],'status'=>$existing['status']];}$file=rs_upload('proof','student_payments');if(!$file)ac_fail('Bukti transfer wajib diunggah.');ac_query($db,'INSERT INTO student_payment_submissions(invoice_link_id,student_id,amount,transfer_date,reference,proof_file,request_key) VALUES(?,?,?,?,?,?,?)',[(int)$link['id'],(int)$student['id'],ac_decimal($amount),$date,$ref,$file,$key]);$id=$db->insert_id;rs_audit($db,$a,'student_payment_submission',$id,'submitted');return ['id'=>$id,'status'=>'pending'];});
}
function sb_review(mysqli $db,array $a,array $d):array{
 sb_finance($db,$a,'post');return ac_atomic($db,function()use($db,$a,$d){$id=ac_id($d['id']??null);$r=ac_one($db,'SELECT * FROM student_payment_submissions WHERE id=? FOR UPDATE',[$id]);if(!$r)ac_fail('Bukti pembayaran tidak ditemukan.',404);if($r['status']!=='pending')ac_fail('Bukti telah direview; keputusan tidak diubah diam-diam.',409);$status=$d['status']??'';if(!in_array($status,['accepted','rejected'],true))ac_fail('Keputusan tidak valid.');$note=ac_text($d['review_notes']??'','Catatan review',2000,$status==='rejected');$tx=null;
 if($status==='accepted'){$tx=ac_id($d['transaction_id']??null);$link=ac_one($db,'SELECT * FROM student_invoice_links WHERE id=?',[(int)$r['invoice_link_id']]);$bill=sb_bill($db,$link);$allocated=ac_one($db,"SELECT pa.amount FROM payment_allocations pa JOIN accounting_source_documents doc ON doc.id=pa.source_document_id JOIN accounting_transactions t ON t.id=pa.transaction_id WHERE t.id=? AND t.journal_status='posted' AND t.payment_status='verified' AND pa.is_reversed=0 AND doc.source_type=? AND doc.source_id=?",[$tx,$bill['source_type'],$bill['source_id']]);if(!$allocated||$allocated['amount']!==$r['amount']||$bill['cancelled'])ac_fail('Harus ditautkan ke pembayaran verified dan posted dengan invoice/nominal yang sama.',409);}
 ac_query($db,'UPDATE student_payment_submissions SET status=?,transaction_id=?,review_notes=?,reviewed_by=?,reviewed_at=NOW() WHERE id=?',[$status,$tx,$note,(int)$a['id'],$id]);rs_audit($db,$a,'student_payment_submission',$id,'reviewed',['status'=>$status,'transaction_id'=>$tx]);return ['id'=>$id,'status'=>$status];});
}

function sb_delete_student(mysqli $db,array $a,array $d):array{
 sb_finance($db,$a,'prepare');
 return ac_atomic($db,function()use($db,$a,$d){
  $id=ac_id($d['id']??$d['student_id']??null,'ID Siswa');
  $student=ac_one($db,'SELECT * FROM peserta_intensif WHERE id=? FOR UPDATE',[$id]);
  if(!$student)ac_fail('Siswa tidak ditemukan.',404);
  $userId=$student['user_id']?(int)$student['user_id']:null;
  if(ac_table($db,'student_payment_submissions'))ac_query($db,'DELETE FROM student_payment_submissions WHERE student_id=?',[$id]);
  if(ac_table($db,'student_invoice_links'))ac_query($db,'DELETE FROM student_invoice_links WHERE student_id=?',[$id]);
  if(ac_table($db,'matching_student_links'))ac_query($db,'DELETE FROM matching_student_links WHERE student_id=?',[$id]);
  if(ac_table($db,'lms_class_enrollments'))ac_query($db,'DELETE FROM lms_class_enrollments WHERE student_id=?',[$id]);
  if(ac_table($db,'lms_grades'))ac_query($db,'DELETE FROM lms_grades WHERE siswa_id=?',[$id]);
  if($userId){
   if(ac_table($db,'lms_submissions'))ac_query($db,'DELETE FROM lms_submissions WHERE siswa_id=?',[$userId]);
   if(ac_table($db,'lms_attendance'))ac_query($db,'DELETE FROM lms_attendance WHERE siswa_id=?',[$userId]);
  }
  ac_query($db,'DELETE FROM peserta_intensif WHERE id=?',[$id]);
  if($userId){
   try{
    if(ac_table($db,'employees'))ac_query($db,'DELETE FROM employees WHERE user_id=?',[$userId]);
    ac_query($db,'DELETE FROM users WHERE id=?',[$userId]);
   }catch(Throwable $e){
    ac_query($db,'UPDATE users SET is_active=0,deleted_at=NOW() WHERE id=?',[$userId]);
   }
  }
  rs_audit($db,$a,'peserta_intensif',$id,'deleted',['nama'=>$student['nama_lengkap']]);
  return ['id'=>$id,'status'=>'deleted','message'=>'Data siswa berhasil dihapus secara permanen.'];
 });
}
function sb_update_student(mysqli $db,array $a,array $d):array{
 sb_finance($db,$a,'prepare');
 return ac_atomic($db,function()use($db,$a,$d){
  $id=ac_id($d['id']??null,'ID Siswa');
  $nama=ac_text($d['nama']??$d['name']??$d['full_name']??'','Nama Siswa',255);
  $batch=ac_text($d['batch']??'Batch Reguler','Batch',100);
  $kontak=ac_text($d['kontak']??$d['phone']??$d['no_wa']??'','Kontak',50,false);
  $email=ac_text($d['email']??'','Email',255,false);
  $level=ac_text($d['level']??'N5','Level',50,false);
  $nis=ac_text($d['nis']??$d['student_id']??'','NIS',50,false);
  $affiliator=ac_text($d['affiliator']??'','Affiliator',100,false);
  $alamat=ac_text($d['alamat']??$d['complete_address']??'','Alamat',2000,false);
  $negara=ac_text($d['negara']??$d['country']??'Indonesia','Negara',50,false);
  $provinsi=ac_text($d['provinsi']??$d['province']??'','Provinsi',100,false);
  $kota=ac_text($d['kota']??$d['city']??'','Kota',100,false);
  $kode_pos=ac_text($d['kode_pos']??$d['postal_code']??'','Kode Pos',20,false);
  $program=ac_text($d['program']??'Program Pelatihan Jepang','Program',150,false);
  $status=ac_text($d['status']??'Aktif','Status',50,false);

  $student=ac_one($db,'SELECT * FROM peserta_intensif WHERE id=? FOR UPDATE',[$id]);
  if(!$student)ac_fail('Siswa tidak ditemukan.',404);
  ac_query($db,'UPDATE peserta_intensif SET nama_lengkap=?,batch=?,no_wa=?,email=?,level=?,nis=?,affiliator=?,alamat=?,negara=?,provinsi=?,kota=?,kode_pos=?,program=?,status=? WHERE id=?',[
    $nama,$batch,$kontak,$email,$level,$nis,$affiliator,$alamat,$negara,$provinsi,$kota,$kode_pos,$program,$status,$id
  ]);
  if($student['user_id']&&$email){
   try{ac_query($db,'UPDATE users SET email=?,updated_at=NOW() WHERE id=?',[$email,(int)$student['user_id']]);}catch(Throwable $e){}
  }
  rs_audit($db,$a,'peserta_intensif',$id,'updated',['nama'=>$nama]);
  return ['id'=>$id,'status'=>'updated','nama'=>$nama,'batch'=>$batch];
 });
}
function sb_create_student(mysqli $db,array $a,array $d):array{
 sb_finance($db,$a,'prepare');
 return ac_atomic($db,function()use($db,$a,$d){
  $nama=ac_text($d['nama']??$d['name']??$d['full_name']??'','Nama Siswa',255);
  $batch=ac_text($d['batch']??'Batch Reguler','Batch',100);
  $kontak=ac_text($d['kontak']??$d['phone']??$d['no_wa']??'','Kontak',50,false);
  $email=ac_text($d['email']??'','Email',255,false);
  $level=ac_text($d['level']??'N5','Level',50,false);
  $nis=ac_text($d['nis']??$d['student_id']??'','NIS',50,false);
  $affiliator=ac_text($d['affiliator']??'','Affiliator',100,false);
  $alamat=ac_text($d['alamat']??$d['complete_address']??'','Alamat',2000,false);
  $negara=ac_text($d['negara']??$d['country']??'Indonesia','Negara',50,false);
  $provinsi=ac_text($d['provinsi']??$d['province']??'','Provinsi',100,false);
  $kota=ac_text($d['kota']??$d['city']??'','Kota',100,false);
  $kode_pos=ac_text($d['kode_pos']??$d['postal_code']??'','Kode Pos',20,false);
  $program=ac_text($d['program']??'Program Pelatihan Jepang','Program',150,false);
  $status=ac_text($d['status']??'Aktif','Status',50,false);

  ac_query($db,'INSERT INTO peserta_intensif(nama_lengkap,batch,no_wa,email,level,nis,affiliator,alamat,negara,provinsi,kota,kode_pos,program,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[
    $nama,$batch,$kontak,$email,$level,$nis,$affiliator,$alamat,$negara,$provinsi,$kota,$kode_pos,$program,$status
  ]);
  $id=(int)$db->insert_id;
  rs_audit($db,$a,'peserta_intensif',$id,'created',['nama'=>$nama]);
  return ['id'=>$id,'status'=>'created','nama'=>$nama];
 });
}

