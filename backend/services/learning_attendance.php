<?php
require_once __DIR__.'/learning.php';
function la_window(array $m):DateTimeImmutable{
 $now=new DateTimeImmutable('now',new DateTimeZone($m['timezone']??'Asia/Jakarta'));
 if($m['type']==='Libur'||$m['class_status']!=='active'||$m['meeting_date']!==$now->format('Y-m-d')||!$m['start_time']||!$m['end_time'])ac_fail('Pertemuan belum membuka presensi hari ini.',409);
 $start=new DateTimeImmutable($m['meeting_date'].' '.$m['start_time'], $now->getTimezone());$end=new DateTimeImmutable($m['meeting_date'].' '.$m['end_time'],$now->getTimezone());
 if($now<$start->modify('-15 minutes')||$now>$end)ac_fail('Di luar waktu presensi pertemuan.',409);return $now;
}
function la_issue(mysqli $db,array $a,int $meeting):array{
 if(!rs_teacher($a))ac_fail('Hanya pengajar/admin dapat membuka presensi.',403);if(!ac_table($db,'lms_attendance_sessions'))ac_fail('Migrasi sesi presensi belum tersedia.',503);
 return ac_atomic($db,function()use($db,$a,$meeting){ac_one($db,'SELECT id FROM lms_meetings WHERE id=? FOR UPDATE',[$meeting]);$m=rs_meeting($db,$a,$meeting,true);$now=la_window($m);$token=bin2hex(random_bytes(32));$expiry=$now->modify('+5 minutes');ac_query($db,'UPDATE lms_attendance_sessions SET revoked=1 WHERE meeting_id=? AND revoked=0',[$meeting]);ac_query($db,'INSERT INTO lms_attendance_sessions(meeting_id,token_hash,issued_by,issued_at,expires_at) VALUES(?,?,?,?,?)',[$meeting,hash('sha256',$token),(int)$a['id'],$now->format('Y-m-d H:i:s'),$expiry->format('Y-m-d H:i:s')]);rs_audit($db,$a,'attendance_session',$db->insert_id,'issued',['meeting_id'=>$meeting]);return ['meeting_id'=>$meeting,'token'=>$token,'expires_at'=>$expiry->format(DateTimeInterface::ATOM),'payload'=>json_encode(['type'=>'creativa_attendance','meeting_id'=>$meeting,'token'=>$token]),'ttl_seconds'=>300];});
}
function la_rows(mysqli $db,array $a,?int $meeting=null):array{
 if($meeting)rs_meeting($db,$a,$meeting);$where=$a['role']==='peserta_intensif'?' AND a.siswa_id='.(int)$a['id']:'';if($meeting)$where.=' AND a.meeting_id='.$meeting;
 return ac_rows($db,'SELECT a.*,m.title AS meeting_title,m.meeting_date,m.start_time,m.end_time,p.nama_lengkap AS siswa_name FROM lms_attendance a JOIN lms_meetings m ON m.id=a.meeting_id LEFT JOIN peserta_intensif p ON p.user_id=a.siswa_id WHERE '.rs_meeting_filter($a).$where.' ORDER BY m.meeting_date DESC,a.attended_at DESC');
}
function la_save(mysqli $db,array $a,array $d):array{
 return ac_atomic($db,function()use($db,$a,$d){
  $meeting=ac_id($d['meeting_id']??null);ac_one($db,'SELECT id FROM lms_meetings WHERE id=? FOR UPDATE',[$meeting]);$m=rs_meeting($db,$a,$meeting,$a['role']!=='peserta_intensif');
  $student=$a['role']==='peserta_intensif'?(int)$a['id']:ac_id($d['siswa_id']??null);$action=$d['action']??'check_in';
  if(!ac_one($db,"SELECT p.id FROM peserta_intensif p JOIN users u ON u.id=p.user_id JOIN roles r ON r.id=u.role_id JOIN lms_class_enrollments ce ON ce.student_id=p.id WHERE p.user_id=? AND u.is_active=1 AND r.name='peserta_intensif' AND ce.class_id=? AND (ce.status='active' OR ce.left_on IS NOT NULL) AND ce.joined_on<=? AND (ce.left_on IS NULL OR ce.left_on>=?)",[$student,(int)$m['class_id'],$m['meeting_date'],$m['meeting_date']]))ac_fail('Siswa tidak terdaftar di kelas pertemuan.',403);
  if($a['role']==='peserta_intensif'){
   rs_student($db,$a);if(!in_array($action,['check_in','check_out'],true))ac_fail('Perubahan status hanya oleh pengajar/admin.',403);$now=la_window($m);$token=$d['token']??'';if(!is_string($token)||!preg_match('/^[a-f0-9]{64}$/D',$token))ac_fail('Scan kode presensi valid dari pengajar.',403);
   $session=ac_one($db,'SELECT id FROM lms_attendance_sessions WHERE meeting_id=? AND token_hash=? AND revoked=0 AND expires_at>?',[$meeting,hash('sha256',$token),$now->format('Y-m-d H:i:s')]);if(!$session)ac_fail('Kode presensi telah kedaluwarsa atau dibatalkan.',403);
  }else{$now=new DateTimeImmutable('now',new DateTimeZone($m['timezone']));if($m['meeting_date']>$now->format('Y-m-d'))ac_fail('Presensi masa depan tidak dapat dicatat.',409);if(!in_array($action,['status'],true))ac_fail('Pengajar menggunakan perubahan status yang diaudit. Siswa check-in melalui QR sendiri.');}
  $note=$action==='status'?ac_text($d['notes']??'','Alasan koreksi',2000):null;$old=ac_one($db,'SELECT * FROM lms_attendance WHERE meeting_id=? AND siswa_id=? FOR UPDATE',[$meeting,$student]);$status=$d['status']??'hadir';$checkIn=$old['check_in']??null;$checkOut=$old['check_out']??null;
  if($action==='check_in'){$status=$old['status']??($now->format('H:i:s')>(new DateTimeImmutable($m['start_time'],$now->getTimezone()))->modify('+10 minutes')->format('H:i:s')?'terlambat':'hadir');if(!$checkIn)$checkIn=$now->format('Y-m-d H:i:s');}
  elseif($action==='check_out'){if(!$checkIn)ac_fail('Check-in harus tercatat sebelum check-out.',409);$status=$old['status'];if(!$checkOut)$checkOut=$now->format('Y-m-d H:i:s');}
  elseif(!in_array($status,['hadir','izin','sakit','terlambat','alpha'],true))ac_fail('Status presensi tidak valid.');
  if($old&&$old['status']===$status&&$old['check_in']===$checkIn&&$old['check_out']===$checkOut)return $old;
  if($old){$id=(int)$old['id'];ac_query($db,'UPDATE lms_attendance SET status=?,check_in=?,check_out=? WHERE id=?',[$status,$checkIn,$checkOut,$id]);}else{ac_query($db,'INSERT INTO lms_attendance(meeting_id,siswa_id,status,check_in,check_out) VALUES(?,?,?,?,?)',[$meeting,$student,$status,$checkIn,$checkOut]);$id=$db->insert_id;}
  rs_audit($db,$a,'lms_attendance',$id,$action,['meeting_id'=>$meeting,'student_user_id'=>$student,'previous_status'=>$old['status']??null,'status'=>$status,'notes'=>$note]);return ac_one($db,'SELECT * FROM lms_attendance WHERE id=?',[$id]);
 });
}
