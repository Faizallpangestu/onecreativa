<?php
require_once __DIR__.'/employee_directory.php';

function rs_admin(array $a):bool{return in_array($a['role'],['admin','super_admin'],true);}
function rs_teacher(array $a):bool{return rs_admin($a)||$a['role']==='sensei';}
function rs_start(mysqli $db,array $roles=['admin','super_admin','sensei','peserta_intensif']):array{
 $a=ed_start($db);
 set_exception_handler(function(Throwable $e){$code=$e instanceof AccountingException?$e->getCode():500;if($e instanceof mysqli_sql_exception&&$e->getCode()===1062)$code=409;if($code>=500)error_log(json_encode(['request_id'=>$GLOBALS['employee_request_id'],'module'=>'relationships','error_class'=>get_class($e),'error_code'=>$e->getCode()]));ed_respond($code,['status'=>'error','message'=>$code>=500?'Data modul belum dapat diproses. Hubungi administrator dengan ID permintaan.':($e instanceof mysqli_sql_exception?'Relasi atau identitas sudah terdaftar.':$e->getMessage())]);});
 if(!in_array($a['role'],$roles,true))ac_fail('Akses modul tidak diizinkan.',403);
 rs_ready($db);return $a;
}
function rs_ready(mysqli $db):void{
 foreach(['lms_classes','lms_teaching_assignments','lms_class_enrollments','lms_meeting_assignments','lms_grade_publications','student_invoice_links','matching_student_links','matching_candidate_history','accounting_audit_logs'] as $name)if(!ac_table($db,$name))ac_fail('Relasi modul belum dikonfigurasi. Administrator perlu menjalankan migrasi release.',503);
}
function rs_student(mysqli $db,array $a):array{
 $rows=ac_rows($db,'SELECT id,user_id,nama_lengkap,level,batch FROM peserta_intensif WHERE user_id=?',[(int)$a['id']]);
 if(count($rows)!==1)ac_fail('Identitas siswa belum terhubung secara unik. Hubungi administrator.',409);return $rows[0];
}
function rs_meeting_filter(array $a,string $alias='m'):string{
 if(rs_admin($a))return '1=1';$uid=(int)$a['id'];
 $teacher=$a['role']==='sensei'?'ta.sensei_user_id='.$uid:"EXISTS(SELECT 1 FROM lms_class_enrollments ce JOIN peserta_intensif p ON p.id=ce.student_id WHERE ce.class_id=ta.class_id AND p.user_id=$uid AND (ce.status='active' OR ce.left_on IS NOT NULL) AND ce.joined_on<=$alias.meeting_date AND (ce.left_on IS NULL OR ce.left_on>=$alias.meeting_date))";
 return "EXISTS(SELECT 1 FROM lms_meeting_assignments ma JOIN lms_teaching_assignments ta ON ta.id=ma.assignment_id JOIN lms_classes c ON c.id=ta.class_id JOIN users teacher ON teacher.id=ta.sensei_user_id JOIN roles tr ON tr.id=teacher.role_id WHERE ma.meeting_id=$alias.id AND ta.is_active=1 AND c.status IN ('active','closed') AND teacher.is_active=1 AND tr.name='sensei' AND ta.starts_on<=$alias.meeting_date AND (ta.ends_on IS NULL OR ta.ends_on>=$alias.meeting_date) AND $teacher)";
}
function rs_meeting(mysqli $db,array $a,int $id,bool $write=false):array{
 $m=ac_one($db,"SELECT m.*,ta.id AS assignment_id,ta.class_id,ta.sensei_user_id AS assigned_sensei,c.status AS class_status,c.timezone FROM lms_meetings m LEFT JOIN lms_meeting_assignments ma ON ma.meeting_id=m.id LEFT JOIN lms_teaching_assignments ta ON ta.id=ma.assignment_id LEFT JOIN lms_classes c ON c.id=ta.class_id WHERE m.id=? AND ".rs_meeting_filter($a),[$id]);
 if(!$m){if(ac_one($db,'SELECT id FROM lms_meetings WHERE id=?',[$id]))ac_fail('Pertemuan berada di luar kelas yang diizinkan.',403);ac_fail('Pertemuan tidak ditemukan.',404);}
 if($write&&(!rs_teacher($a)||!$m['assignment_id']||$m['class_status']!=='active'))ac_fail('Pengubahan memerlukan assignment valid pada kelas aktif.',403);
 return $m;
}
function rs_class_filter(array $a,string $alias='c'):string{
 if(rs_admin($a))return '1=1';$uid=(int)$a['id'];
 if($a['role']==='sensei')return "EXISTS(SELECT 1 FROM lms_teaching_assignments ta WHERE ta.class_id=$alias.id AND ta.sensei_user_id=$uid AND ta.is_active=1 AND ta.starts_on<=CURDATE() AND (ta.ends_on IS NULL OR ta.ends_on>=CURDATE()))";
 return "(EXISTS(SELECT 1 FROM lms_class_enrollments ce JOIN peserta_intensif p ON p.id=ce.student_id WHERE ce.class_id=$alias.id AND p.user_id=$uid AND ce.status='active') OR EXISTS(SELECT 1 FROM peserta_intensif p WHERE p.user_id=$uid AND LOWER(TRIM(p.batch))=LOWER(TRIM($alias.batch)) AND $alias.status='active'))";
}
function rs_roster(mysqli $db,array $a):array{
 $self=$a['role']==='peserta_intensif'?' AND p.user_id='.(int)$a['id']:'';
 return ac_rows($db,"SELECT DISTINCT p.id,p.user_id,p.nama_lengkap AS name,p.nama_lengkap,p.level,p.batch,u.is_active FROM peserta_intensif p JOIN users u ON u.id=p.user_id JOIN roles r ON r.id=u.role_id WHERE r.name='peserta_intensif' AND u.is_active=1 $self AND (EXISTS(SELECT 1 FROM lms_class_enrollments ce JOIN lms_classes c ON c.id=ce.class_id WHERE ce.student_id=p.id AND ce.status='active' AND c.status='active' AND ".rs_class_filter($a).") OR EXISTS(SELECT 1 FROM lms_classes c WHERE LOWER(TRIM(c.batch))=LOWER(TRIM(p.batch)) AND c.status='active' AND ".rs_class_filter($a).")) ORDER BY p.nama_lengkap");
}
function rs_audit(mysqli $db,array $a,string $entity,int|string $id,string $event,array $details=[]):void{ac_audit($db,$a,$entity,(string)$id,$event,$details);}
function rs_assignment(mysqli $db,array $a,int $id,string $date):array{
 $ta=ac_one($db,"SELECT ta.*,c.status,u.is_active AS teacher_active,r.name AS teacher_role FROM lms_teaching_assignments ta JOIN lms_classes c ON c.id=ta.class_id JOIN users u ON u.id=ta.sensei_user_id JOIN roles r ON r.id=u.role_id WHERE ta.id=?",[$id]);
 if(!$ta||(!$ta['teacher_active'])||$ta['teacher_role']!=='sensei'||!$ta['is_active']||$ta['status']!=='active'||$date<$ta['starts_on']||($ta['ends_on']&&$date>$ta['ends_on']))ac_fail('Assignment pengajar/tanggal tidak aktif atau tidak valid.',409);
 if(!rs_admin($a)&&(int)$ta['sensei_user_id']!==(int)$a['id'])ac_fail('Assignment bukan milik pengajar ini.',403);return $ta;
}
function rs_admin_mutate(mysqli $db,array $a,array $d):array{
 if(!rs_admin($a))ac_fail('Relasi hanya dikelola administrator.',403);
 return ac_atomic($db,function()use($db,$a,$d){
  ac_one($db,'SELECT id FROM users WHERE id=? FOR UPDATE',[(int)$a['id']]);
  $action=$d['action']??'';
  if($action==='class'){
   $rawId=$d['id']??null;
   $id=(!empty($rawId)&&is_numeric($rawId)&&(int)$rawId>0)?(int)$rawId:null;
   $status=$d['status']??'active';if(!in_array($status,['draft','active','closed'],true))$status='active';
   $tz=$d['timezone']??'Asia/Jakarta';if(!in_array($tz,DateTimeZone::listIdentifiers(),true))$tz='Asia/Jakarta';
   $scheduleDays=ac_text($d['schedule_days']??'Senin & Rabu','Hari Jadwal',100,false);
   $scheduleTime=ac_text($d['schedule_time']??'08:00 - 09:30','Jam Jadwal',100,false);
   $totalMeetings=max(1, (int)($d['total_meetings']??32));
   $completedMeetings=max(0, (int)($d['completed_meetings']??0));
   $params=[ac_text($d['code']??'','Kode',50),ac_text($d['name']??'','Nama',150),ac_text($d['program_code']??'','Program',100),ac_text($d['batch']??'','Batch',100),ac_text($d['level']??'','Level',50,false),$scheduleDays,$scheduleTime,$totalMeetings,$completedMeetings,$tz,$status];
   if($id){
    if(!ac_one($db,'SELECT id FROM lms_classes WHERE id=? FOR UPDATE',[$id])){
      ac_query($db,'INSERT INTO lms_classes(code,name,program_code,batch,level,schedule_days,schedule_time,total_meetings,completed_meetings,timezone,status,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',[...$params,(int)$a['id']]);$id=$db->insert_id;
    }else{
      ac_query($db,'UPDATE lms_classes SET code=?,name=?,program_code=?,batch=?,level=?,schedule_days=?,schedule_time=?,total_meetings=?,completed_meetings=?,timezone=?,status=? WHERE id=?',[...$params,$id]);
    }
   }
   else{ac_query($db,'INSERT INTO lms_classes(code,name,program_code,batch,level,schedule_days,schedule_time,total_meetings,completed_meetings,timezone,status,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',[...$params,(int)$a['id']]);$id=$db->insert_id;}
   rs_audit($db,$a,'lms_class',$id,'saved',['status'=>$status]);return ['id'=>$id];
  }
  if($action==='delete_class'){
   $rawId=$d['id']??($d['class_id']??null);
   if(empty($rawId)||!is_numeric($rawId))ac_fail('ID kelas tidak valid untuk dihapus.');
   $id=(int)$rawId;
   $cls=ac_one($db,'SELECT id,name FROM lms_classes WHERE id=? FOR UPDATE',[$id]);
   if(!$cls)ac_fail('Kelas tidak ditemukan.',404);
   ac_query($db,'DELETE FROM lms_grade_publications WHERE class_id=?',[$id]);
   ac_query($db,'DELETE FROM lms_class_enrollments WHERE class_id=?',[$id]);
   if(ac_table($db,'lms_meeting_assignments')){
    ac_query($db,'DELETE ma FROM lms_meeting_assignments ma JOIN lms_teaching_assignments ta ON ta.id=ma.assignment_id WHERE ta.class_id=?',[$id]);
   }
   ac_query($db,'DELETE FROM lms_teaching_assignments WHERE class_id=?',[$id]);
   ac_query($db,'DELETE FROM lms_classes WHERE id=?',[$id]);
   rs_audit($db,$a,'lms_class',$id,'deleted',['name'=>$cls['name']]);
   return ['id'=>$id,'deleted'=>true];
  }
  $class=ac_id($d['class_id']??null);$c=ac_one($db,"SELECT id FROM lms_classes WHERE id=? AND status<>'closed' FOR UPDATE",[$class]);if(!$c)ac_fail('Kelas tidak ditemukan atau telah ditutup.',409);
  if($action==='assignment'){
   $uid=ac_id($d['sensei_user_id']??null);if(!ac_one($db,"SELECT u.id FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? AND u.is_active=1 AND r.name IN ('sensei','sensei_intensif')",[$uid]))ac_fail('Akun Sensei aktif diperlukan.');
   $start=empty($d['starts_on'])?date('Y-m-d'):ac_date($d['starts_on']);$end=empty($d['ends_on'])?null:ac_date($d['ends_on']);if($end&&$end<$start)ac_fail('Tanggal selesai harus setelah tanggal mulai.');
   ac_query($db,'UPDATE lms_teaching_assignments SET is_active=0 WHERE class_id=?',[$class]);
   ac_query($db,'INSERT INTO lms_teaching_assignments(class_id,sensei_user_id,starts_on,ends_on,is_active,assigned_by) VALUES(?,?,?,?,1,?)',[$class,$uid,$start,$end,(int)$a['id']]);$id=$db->insert_id;rs_audit($db,$a,'teaching_assignment',$id,'created',['class_id'=>$class,'sensei_user_id'=>$uid]);return ['id'=>$id];
  }
  if($action==='enrollment'){
   $student=ac_id($d['student_id']??null);if(!ac_one($db,"SELECT p.id FROM peserta_intensif p WHERE p.id=?",[$student]))ac_fail('Siswa tidak ditemukan.');
   $joined=empty($d['joined_on'])?date('Y-m-d'):ac_date($d['joined_on']);$left=empty($d['left_on'])?null:ac_date($d['left_on']);if($left&&$left<$joined)ac_fail('Tanggal selesai enrollment tidak valid.');$status=$d['status']??'active';if(!in_array($status,['active','completed','withdrawn'],true))ac_fail('Status enrollment tidak valid.');
   if($status!=='active'&&!$left)ac_fail('Enrollment selesai atau keluar memerlukan tanggal akhir.');
   $old=ac_one($db,'SELECT id FROM lms_class_enrollments WHERE class_id=? AND student_id=? FOR UPDATE',[$class,$student]);
   if($old){$id=$old['id'];ac_query($db,'UPDATE lms_class_enrollments SET joined_on=?,left_on=?,status=? WHERE id=?',[$joined,$left,$status,$id]);}
   else{ac_query($db,'INSERT INTO lms_class_enrollments(class_id,student_id,joined_on,left_on,status,enrolled_by) VALUES(?,?,?,?,?,?)',[$class,$student,$joined,$left,$status,(int)$a['id']]);$id=$db->insert_id;}
   rs_audit($db,$a,'class_enrollment',$id,'saved',['class_id'=>$class,'student_id'=>$student,'status'=>$status]);return ['id'=>$id];
  }
  if($action==='auto_enroll_batch'){
   $classRow=ac_one($db,"SELECT id,batch FROM lms_classes WHERE id=?",[$class]);
   if(!$classRow)ac_fail('Kelas tidak ditemukan.',404);
   $batch=trim($classRow['batch']);
   if($batch==='')ac_fail('Batch kelas belum diisi.',400);
   $candidates=ac_rows($db,"SELECT p.id FROM peserta_intensif p WHERE LOWER(TRIM(p.batch))=LOWER(TRIM(?))",[$batch]);
   $enrolledCount=0;
   foreach($candidates as $cand){
     $exists=ac_one($db,"SELECT id FROM lms_class_enrollments WHERE class_id=? AND student_id=?",[$class,(int)$cand['id']]);
     if(!$exists){
       ac_query($db,"INSERT INTO lms_class_enrollments(class_id,student_id,joined_on,status,enrolled_by) VALUES(?,?,CURDATE(),'active',?)",[$class,(int)$cand['id'],(int)$a['id']]);
       $enrolledCount++;
     }
   }
   rs_audit($db,$a,'class_enrollment',$class,'auto_enrolled_batch',['batch'=>$batch,'count'=>$enrolledCount]);
   return ['class_id'=>$class,'enrolled_count'=>$enrolledCount,'total_batch_students'=>count($candidates)];
  }
  ac_fail('Operasi relasi tidak dikenal.');
 });
}
function rs_upload(string $field,string $folder,array $mimes=['application/pdf'=>'pdf','image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp']):?string{
 if(!isset($_FILES[$field])||$_FILES[$field]['error']===UPLOAD_ERR_NO_FILE)return null;
 $f=$_FILES[$field];if($f['error']!==UPLOAD_ERR_OK||$f['size']>10*1024*1024||!is_uploaded_file($f['tmp_name']))ac_fail('Upload tidak lengkap atau melebihi 10 MB.');
 $mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);if(!isset($mimes[$mime]))ac_fail('Jenis file tidak diizinkan. Gunakan PDF, JPG, PNG, atau WebP.');
 $dir=(getenv('CREATIVA_PRIVATE_UPLOAD_DIR')?:__DIR__.'/../storage/documents').'/'.$folder;if(!is_dir($dir)&&!mkdir($dir,0750,true))ac_fail('Penyimpanan dokumen belum tersedia.',503);
 $name=bin2hex(random_bytes(16)).'.'.$mimes[$mime];if(!move_uploaded_file($f['tmp_name'],$dir.'/'.$name))ac_fail('Dokumen gagal disimpan.',503);return $name;
}
function rs_document(string $folder,string $name,string $legacyFolder=''):array{
 if($name===''||basename($name)!==$name||str_contains($name,'\\'))ac_fail('Dokumen tidak ditemukan.',404);
 $base=(getenv('CREATIVA_PRIVATE_UPLOAD_DIR')?:__DIR__.'/../storage/documents').'/'.$folder;
 $file=$base.'/'.$name;if(!is_file($file)&&$legacyFolder)$file=__DIR__.'/../uploads/'.$legacyFolder.'/'.$name;
 if(!is_file($file)||is_link($file))ac_fail('Dokumen tidak ditemukan.',404);
 $mime=(new finfo(FILEINFO_MIME_TYPE))->file($file);if(!in_array($mime,['application/pdf','image/jpeg','image/png','image/webp','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],true))ac_fail('Dokumen memerlukan review format.',409);
 return [$file,$mime];
}
function rs_file(string $folder,string $name,string $legacyFolder=''):never{
 [$file,$mime]=rs_document($folder,$name,$legacyFolder);
 header('Content-Type: '.$mime);header('Content-Disposition: '.(str_starts_with($mime,'image/')?'inline':'attachment').'; filename="'.basename($name).'"');header('X-Content-Type-Options: nosniff');header('Content-Length: '.filesize($file));readfile($file);exit;
}
