<?php
require_once __DIR__.'/relationships.php';
function mk_access(mysqli $db,array $a,int $id):array{
 $r=ac_one($db,'SELECT * FROM lpk_matching_job WHERE id=?',[$id]);if(!$r)ac_fail('Kandidat tidak ditemukan.',404);
 if(!rs_admin($a)&&!ac_one($db,"SELECT id FROM matching_candidate_history WHERE candidate_id=? AND action='created' AND actor_id=?",[$id,(int)$a['id']]))ac_fail('Kandidat tidak berada dalam cakupan pengelolaan akun ini.',403);return $r;
}
function mk_verified(mysqli $db,int $id,array $row,string $field):bool{return !empty($row[$field])&&(bool)ac_one($db,'SELECT id FROM matching_candidate_history WHERE candidate_id=? AND action=? AND next_status=?',[$id,'verified_'.$field,$row[$field]]);}
function mk_mutate(mysqli $db,array $a,array $d):array{
 return ac_atomic($db,function()use($db,$a,$d){
  ac_one($db,'SELECT id FROM roles ORDER BY id LIMIT 1 FOR UPDATE');$id=empty($d['id'])?null:ac_id($d['id']);$old=$id?mk_access($db,$a,$id):null;if($id)ac_one($db,'SELECT id FROM lpk_matching_job WHERE id=? FOR UPDATE',[$id]);$action=$d['action']??'';
  if($action==='verify_document'){
   if(!$old)ac_fail('Kandidat diperlukan.');$field=$d['field']??'';if(!in_array($field,['file_cv','file_jft','file_ssw','file_jlpt'],true)||empty($old[$field]))ac_fail('Dokumen belum tersedia.');rs_document('matching',$old[$field],'matching');$note=ac_text($d['notes']??'','Catatan verifikasi',2000);ac_query($db,'INSERT INTO matching_candidate_history(candidate_id,action,next_status,notes,actor_id) VALUES(?,?,?,?,?)',[$id,'verified_'.$field,$old[$field],$note,(int)$a['id']]);rs_audit($db,$a,'matching_candidate',$id,'document_verified',['field'=>$field]);return ['id'=>$id];
  }
  $statuses=['Pendaftaran','Screening Berkas','Matching Job','Interview User','Lolos Interview','Proses MCU','Pengajuan CoE','Pengajuan Visa','Siap Terbang','Gagal / Batal'];$progress=$d['progress']??$old['progress']??'Pendaftaran';if(!in_array($progress,$statuses,true))ac_fail('Progress kandidat tidak valid.');
  $notes=ac_text($d['notes']??$d['catatan']??'','Catatan',10000,false);
  if($old&&$progress!==$old['progress']&&$notes==='')ac_fail('Perubahan progress memerlukan catatan hasil/review.');
  if($progress==='Siap Terbang'&&(!$old||!mk_verified($db,$id,$old,'file_cv')||!mk_verified($db,$id,$old,'file_ssw')||(!mk_verified($db,$id,$old,'file_jft')&&!mk_verified($db,$id,$old,'file_jlpt'))))ac_fail('Dokumen CV, SSW, dan JFT/JLPT harus diverifikasi sebelum status siap terbang.',409);
  if($action==='update_progress'){
   if(!$old)ac_fail('Kandidat tidak ditemukan.',404);if($progress===$old['progress'])return ['id'=>$id];ac_query($db,'UPDATE lpk_matching_job SET progress=? WHERE id=?',[$progress,$id]);ac_query($db,'INSERT INTO matching_candidate_history(candidate_id,action,previous_status,next_status,notes,actor_id) VALUES(?,?,?,?,?,?)',[$id,'progress',$old['progress'],$progress,$notes,(int)$a['id']]);rs_audit($db,$a,'matching_candidate',$id,'progress_changed');return ['id'=>$id];
  }
  $student=empty($d['student_id'])?null:ac_id($d['student_id']);$profile=$student?ac_one($db,'SELECT id,nama_lengkap,email,no_wa FROM peserta_intensif WHERE id=?',[$student]):null;if($student&&!$profile)ac_fail('Profil siswa tidak ditemukan.');
  if($student&&ac_one($db,'SELECT candidate_id FROM matching_student_links WHERE student_id=? AND candidate_id<>?',[$student,$id??0]))ac_fail('Siswa sudah mempunyai kandidat terhubung; gunakan kandidat tersebut.',409);
  $name=ac_text($profile['nama_lengkap']??$d['nama_lengkap']??$old['nama_lengkap']??'','Nama',255);$email=ac_text($profile['email']??$d['email']??$old['email']??'','Email',255,false);if($email!==''&&!filter_var($email,FILTER_VALIDATE_EMAIL))ac_fail('Email tidak valid.');$phone=ac_text($profile['no_wa']??$d['no_wa']??$old['no_wa']??'','WhatsApp',50,false);$phone=preg_replace('/[\s()+.-]/','',$phone);if($phone!==''&&!preg_match('/^\d{8,20}$/D',$phone))ac_fail('Nomor WhatsApp tidak valid.');if($email===''&&$phone==='')ac_fail('Email atau WhatsApp diperlukan untuk identitas kandidat.');
  if(ac_one($db,"SELECT id FROM lpk_matching_job WHERE id<>? AND ((?<>'' AND LOWER(TRIM(email))=LOWER(?)) OR (?<>'' AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(no_wa,' ',''),'+',''),'-',''),'(',''),')',''),'.',''),CHAR(9),'')=?))",[$id??0,$email,$email,$phone,$phone]))ac_fail('Identitas kandidat sudah terdaftar. Gunakan kandidat yang ada.',409);
  $age=$d['usia']??$old['usia']??null;if($age==='')$age=null;if($age!==null&&(!ctype_digit((string)$age)||(int)$age<0||(int)$age>120))ac_fail('Usia tidak valid.');
  $files=[];foreach(['foto','file_cv','file_jft','file_ssw','file_jlpt']as $field)$files[$field]=rs_upload($field,'matching',$field==='foto'?['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp']:['application/pdf'=>'pdf','image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'])??$old[$field]??null;
  $jobId=!empty($d['job_id'])?ac_id($d['job_id']):($old['job_id']??null);
  $tskName=ac_text($d['tsk_name']??$old['tsk_name']??'','TSK',255,false);
  $biayaMatching=isset($d['biaya_matching'])&&$d['biaya_matching']!==''?(float)$d['biaya_matching']:($old['biaya_matching']??null);
  $includeFasilitas=isset($d['include_fasilitas'])?(is_array($d['include_fasilitas'])?json_encode(array_values($d['include_fasilitas']),JSON_UNESCAPED_UNICODE):(string)$d['include_fasilitas']):($old['include_fasilitas']??null);
  $params=[$name,$age,ac_text($d['lpk_pengirim']??$old['lpk_pengirim']??'','LPK pengirim',255,false),$tskName,ac_text($d['bidang']??$old['bidang']??'','Bidang',255,false),$jobId,$biayaMatching,$includeFasilitas,$phone,$email,$files['foto'],$files['file_cv'],$files['file_ssw'],$files['file_jft'],$files['file_jlpt'],$progress,ac_text($d['catatan']??$old['catatan']??'','Catatan',10000,false)];
  if($old)ac_query($db,'UPDATE lpk_matching_job SET nama_lengkap=?,usia=?,lpk_pengirim=?,tsk_name=?,bidang=?,job_id=?,biaya_matching=?,include_fasilitas=?,no_wa=?,email=?,foto=?,file_cv=?,file_ssw=?,file_jft=?,file_jlpt=?,progress=?,catatan=? WHERE id=?',[...$params,$id]);else{ac_query($db,'INSERT INTO lpk_matching_job(nama_lengkap,usia,lpk_pengirim,tsk_name,bidang,job_id,biaya_matching,include_fasilitas,no_wa,email,foto,file_cv,file_ssw,file_jft,file_jlpt,progress,catatan) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',$params);$id=$db->insert_id;}
  if($student){$link=ac_one($db,'SELECT student_id FROM matching_student_links WHERE candidate_id=?',[$id]);if($link&&(int)$link['student_id']!==$student)ac_fail('Identitas yang sudah ditautkan memerlukan review koreksi.',409);if(!$link)ac_query($db,'INSERT INTO matching_student_links(candidate_id,student_id,linked_by) VALUES(?,?,?)',[$id,$student,(int)$a['id']]);}
  ac_query($db,'INSERT INTO matching_candidate_history(candidate_id,action,previous_status,next_status,notes,actor_id) VALUES(?,?,?,?,?,?)',[$id,$old?'updated':'created',$old['progress']??null,$progress,$notes,(int)$a['id']]);rs_audit($db,$a,'matching_candidate',$id,$old?'updated':'created',['student_id'=>$student,'progress'=>$progress,'job_id'=>$jobId,'fields'=>array_keys($d)]);return ['id'=>$id];
 });
}
function mk_mutate_job(mysqli $db,array $a,array $d):array{
 if(!in_array($a['role'],['admin','super_admin','lpk'],true))ac_fail('Akses lowongan pekerjaan tidak diizinkan.',403);
 return ac_atomic($db,function()use($db,$a,$d){
  $action=$d['action']??'';
  if($action==='delete_job'){
   $id=ac_id($d['id']??null);
   $candCount=(int)(ac_one($db,'SELECT COUNT(*) AS c FROM lpk_matching_job WHERE job_id=?',[$id])['c']??0);
   if($candCount>0){
    ac_query($db,"UPDATE matching_jobs SET status='closed' WHERE id=?",[$id]);
    return ['id'=>$id,'status'=>'closed','message'=>'Lowongan ditutup karena memiliki kandidat terdaftar.'];
   }
   ac_query($db,'DELETE FROM matching_jobs WHERE id=?',[$id]);
   return ['id'=>$id,'deleted'=>true];
  }
  $id=empty($d['id'])?null:ac_id($d['id']);
  $jobTitle=ac_text($d['job_title']??'','Nama Pekerjaan/Posisi',255);
  $bidang=ac_text($d['bidang']??'','Bidang Pekerjaan',150);
  $sourceType=ac_text($d['source_type']??'TSK','Tipe Sumber Job',50);
  $sourceName=ac_text($d['source_name']??'','Nama TSK/LPK Asal Job',255);
  $sourcePic=ac_text($d['source_pic']??'','PIC Lembaga',255,false);
  $sourceContact=ac_text($d['source_contact']??'','Kontak PIC',100,false);
  $lokasiJepang=ac_text($d['lokasi_jepang']??'','Lokasi Penempatan di Jepang',255);
  $kuota=max(1,(int)($d['kuota']??1));
  $totalBiaya=max(0,(float)($d['total_biaya']??0));
  $currency=ac_text($d['currency']??'IDR','Mata Uang',10,false)?:'IDR';
  $includeItems=is_array($d['include_items']??null)?json_encode(array_values($d['include_items']),JSON_UNESCAPED_UNICODE):ac_text($d['include_items']??'','Include Fasilitas',5000,false);
  $includeCustom=ac_text($d['include_custom']??'','Fasilitas Kustom Tambahan',2000,false);
  $excludeItems=ac_text($d['exclude_items']??'','Biaya Tidak Termasuk (Exclude)',2000,false);
  $estimasiGaji=ac_text($d['estimasi_gaji']??'','Estimasi Gaji',255,false);
  $persyaratan=ac_text($d['persyaratan']??'','Persyaratan & Kualifikasi',3000,false);
  $status=in_array($d['status']??'open',['open','interview','fulfilled','closed'],true)?$d['status']:'open';
  $deskripsi=ac_text($d['deskripsi']??'','Deskripsi Lowongan',5000,false);

  $params=[$jobTitle,$bidang,$sourceType,$sourceName,$sourcePic,$sourceContact,$lokasiJepang,$kuota,$totalBiaya,$currency,$includeItems,$includeCustom,$excludeItems,$estimasiGaji,$persyaratan,$status,$deskripsi];
  if($id){
   if(!ac_one($db,'SELECT id FROM matching_jobs WHERE id=?',[$id]))ac_fail('Lowongan job tidak ditemukan.',404);
   ac_query($db,'UPDATE matching_jobs SET job_title=?,bidang=?,source_type=?,source_name=?,source_pic=?,source_contact=?,lokasi_jepang=?,kuota=?,total_biaya=?,currency=?,include_items=?,include_custom=?,exclude_items=?,estimasi_gaji=?,persyaratan=?,status=?,deskripsi=? WHERE id=?',[...$params,$id]);
  }else{
   ac_query($db,'INSERT INTO matching_jobs(job_title,bidang,source_type,source_name,source_pic,source_contact,lokasi_jepang,kuota,total_biaya,currency,include_items,include_custom,exclude_items,estimasi_gaji,persyaratan,status,deskripsi,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[...$params,(int)$a['id']]);
   $id=$db->insert_id;
  }
  return ['id'=>$id,'job_title'=>$jobTitle];
 });
}
