<?php
require_once __DIR__.'/relationships.php';
function ls_task(mysqli $db,array $a,int $id,bool $write=false):array{$t=ac_one($db,'SELECT * FROM lms_tasks WHERE id=?',[$id]);if(!$t)ac_fail('Tugas tidak ditemukan.',404);$m=rs_meeting($db,$a,(int)$t['meeting_id'],$write);if($m['type']==='Libur'&&$write)ac_fail('Pertemuan dibatalkan.',409);return $t+['class_id'=>$m['class_id'],'timezone'=>$m['timezone']];}
function ls_submissions(mysqli $db,array $a,?int $task=null):array{
 if($task)ls_task($db,$a,$task);
 $filter=$a['role']==='peserta_intensif'?' AND s.siswa_id='.(int)$a['id']:'';if($task)$filter.=' AND s.task_id='.$task;
 $rows=ac_rows($db,'SELECT s.*,p.nama_lengkap AS siswa_name,m.title AS meeting_title,t.title AS task_title,t.category,gp.published_at,gp.class_id FROM lms_submissions s JOIN lms_tasks t ON t.id=s.task_id JOIN lms_meetings m ON m.id=t.meeting_id LEFT JOIN peserta_intensif p ON p.user_id=s.siswa_id LEFT JOIN lms_grade_publications gp ON gp.submission_id=s.id WHERE '.rs_meeting_filter($a).$filter.' ORDER BY s.submitted_at DESC');
 if($a['role']==='peserta_intensif')foreach($rows as &$r)if(!$r['published_at']){$r['grade']=null;$r['feedback']=null;if($r['status']==='graded')$r['status']='submitted';}unset($r);return $rows;
}
function ls_submit(mysqli $db,array $a,array $d):array{
 if($a['role']!=='peserta_intensif')ac_fail('Submission hanya oleh akun siswa.',403);rs_student($db,$a);
 return ac_atomic($db,function()use($db,$a,$d){
  ac_one($db,'SELECT id FROM users WHERE id=? FOR UPDATE',[(int)$a['id']]);$task=ac_id($d['task_id']??null);$t=ls_task($db,$a,$task);$m=rs_meeting($db,$a,(int)$t['meeting_id']);if($m['type']==='Libur'||$m['class_status']!=='active')ac_fail('Pertemuan tidak menerima submission.',409);
  if($t['due_date']&&new DateTimeImmutable('now',new DateTimeZone($t['timezone']))>new DateTimeImmutable($t['due_date'],new DateTimeZone($t['timezone'])))ac_fail('Batas pengumpulan tugas telah lewat.',409);
  $old=ac_one($db,'SELECT * FROM lms_submissions WHERE task_id=? AND siswa_id=? FOR UPDATE',[$task,(int)$a['id']]);if($old&&$old['status']==='graded')ac_fail('Submission sudah dinilai; hubungi pengajar untuk revisi.',409);
  $text=ac_text($d['submission_text']??'','Jawaban',30000,false);$file=rs_upload('submission_file','submissions');if($text===''&&!$file&&!($old['submission_file']??null))ac_fail('Jawaban atau dokumen wajib diisi.');
  if($old){$id=(int)$old['id'];if($text===$old['submission_text']&&!$file)return ['id'=>$id];ac_query($db,"UPDATE lms_submissions SET submission_text=?,submission_file=?,status='submitted',submitted_at=CURRENT_TIMESTAMP WHERE id=?",[$text,$file??$old['submission_file'],$id]);}
  else{ac_query($db,'INSERT INTO lms_submissions(task_id,siswa_id,submission_text,submission_file) VALUES(?,?,?,?)',[$task,(int)$a['id'],$text,$file]);$id=$db->insert_id;}
  rs_audit($db,$a,'lms_submission',$id,$old?'resubmitted':'submitted',['task_id'=>$task]);return ['id'=>$id];
 });
}
function ls_grade(mysqli $db,array $a,array $d):array{
 if(!rs_teacher($a))ac_fail('Akses penilaian ditolak.',403);
 return ac_atomic($db,function()use($db,$a,$d){
  $id=ac_id($d['submission_id']??null);$s=ac_one($db,'SELECT * FROM lms_submissions WHERE id=? FOR UPDATE',[$id]);if(!$s)ac_fail('Submission tidak ditemukan.',404);$t=ls_task($db,$a,(int)$s['task_id'],true);
  $publication=ac_one($db,'SELECT * FROM lms_grade_publications WHERE submission_id=? FOR UPDATE',[$id]);
  if(($d['action']??'')==='publish'){
   if($s['status']!=='graded'||$s['grade']===null||$s['grade']===''||!$publication)ac_fail('Nilai belum lengkap; simpan draft penilaian dahulu.',409);
   if($publication['published_at'])return ['id'=>$id,'published'=>true];
   ac_query($db,'UPDATE lms_grade_publications SET published_by=?,published_at=NOW() WHERE submission_id=?',[(int)$a['id'],$id]);rs_audit($db,$a,'lms_submission',$id,'grade_published');return ['id'=>$id,'published'=>true];
  }
  if($publication&&$publication['published_at'])ac_fail('Nilai terpublikasi tidak diubah diam-diam. Gunakan proses koreksi yang direview.',409);
  $grade=(string)($d['grade']??'');if(!preg_match('/^\d{1,3}(?:\.\d{1,2})?$/D',$grade)||(float)$grade>100)ac_fail('Nilai harus 0 sampai 100.');
  ac_query($db,"UPDATE lms_submissions SET grade=?,feedback=?,status='graded',submitted_at=submitted_at WHERE id=?",[$grade,ac_text($d['feedback']??'','Umpan balik',10000,false),$id]);
  ac_query($db,'INSERT INTO lms_grade_publications(class_id,submission_id) VALUES(?,?) ON DUPLICATE KEY UPDATE class_id=VALUES(class_id)',[(int)$t['class_id'],$id]);rs_audit($db,$a,'lms_submission',$id,'grade_draft_saved');return ['id'=>$id,'published'=>false];
 });
}
function ls_grades(mysqli $db,array $a):array{
 $rows=rs_roster($db,$a);foreach($rows as &$r){$grade=ac_one($db,'SELECT g.*,gp.published_at,gp.class_id FROM lms_grades g LEFT JOIN lms_grade_publications gp ON gp.grade_record_id=g.id WHERE g.siswa_id=?',[(int)$r['id']]);$inScope=$grade&&$grade['class_id']&&ac_one($db,'SELECT c.id FROM lms_classes c WHERE c.id=? AND '.rs_class_filter($a),[(int)$grade['class_id']]);$visible=$inScope&&($a['role']!=='peserta_intensif'||$grade['published_at']);foreach(['quiz','latihan1','latihan2','kaiwa']as $key)$r[$key]=$visible?$grade[$key]:null;$r['grade_record_id']=$inScope?($grade['id']??null):null;$r['published_at']=$inScope?($grade['published_at']??null):null;$r['class']=trim(($r['level']??'').' - '.($r['batch']??''));}unset($r);return $rows;
}
function ls_summary_save(mysqli $db,array $a,array $d):array{
 if(!rs_teacher($a))ac_fail('Hanya pengajar/admin dapat menilai.',403);
 return ac_atomic($db,function()use($db,$a,$d){
  $class=ac_id($d['class_id']??null);$student=ac_id($d['siswa_id']??null);$c=ac_one($db,"SELECT c.id FROM lms_classes c WHERE c.id=? AND c.status='active' AND ".rs_class_filter($a).' FOR UPDATE',[$class]);if(!$c)ac_fail('Kelas bukan assignment aktif pengajar.',403);
  if(!ac_one($db,'SELECT id FROM lms_class_enrollments WHERE class_id=? AND student_id=?',[$class,$student]))ac_fail('Siswa tidak terdaftar di kelas.',403);
  $old=ac_one($db,'SELECT g.*,gp.class_id,gp.published_at FROM lms_grades g LEFT JOIN lms_grade_publications gp ON gp.grade_record_id=g.id WHERE g.siswa_id=? FOR UPDATE',[$student]);
  if($old&&(!$old['class_id']||(int)$old['class_id']!==$class))ac_fail('Nilai existing berasal dari relasi berbeda atau belum terverifikasi. Gunakan penilaian per tugas.',409);
  if(($d['action']??'')==='publish'){
   if(!$old)ac_fail('Draft nilai belum tersedia.',409);foreach(['quiz','latihan1','latihan2','kaiwa']as $key)if($old[$key]===null)ac_fail('Seluruh nilai harus lengkap sebelum publikasi.',409);
   if(!$old['published_at']){ac_query($db,'UPDATE lms_grade_publications SET published_at=NOW(),published_by=? WHERE grade_record_id=?',[(int)$a['id'],(int)$old['id']]);rs_audit($db,$a,'lms_grade',(int)$old['id'],'published');}return ['id'=>(int)$old['id'],'published'=>true];
  }
  if($old&&$old['published_at'])ac_fail('Nilai terpublikasi memerlukan proses koreksi yang direview.',409);
  $scores=[];foreach(['quiz','latihan1','latihan2','kaiwa']as $key){$v=$d[$key]??null;if(!is_int($v)&&!is_string($v))ac_fail('Seluruh nilai wajib diisi.');if(!preg_match('/^\d{1,3}$/D',(string)$v)||(int)$v>100)ac_fail('Nilai harus 0 sampai 100.');$scores[]=(int)$v;}
  if($old){$id=(int)$old['id'];ac_query($db,'UPDATE lms_grades SET quiz=?,latihan1=?,latihan2=?,kaiwa=? WHERE id=?',[...$scores,$id]);}else{ac_query($db,'INSERT INTO lms_grades(siswa_id,quiz,latihan1,latihan2,kaiwa) VALUES(?,?,?,?,?)',[$student,...$scores]);$id=$db->insert_id;ac_query($db,'INSERT INTO lms_grade_publications(class_id,grade_record_id) VALUES(?,?)',[$class,$id]);}rs_audit($db,$a,'lms_grade',$id,'draft_saved',['class_id'=>$class,'student_id'=>$student]);return ['id'=>$id,'published'=>false];
 });
}
