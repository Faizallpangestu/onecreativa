<?php
header('Content-Type: application/json; charset=utf-8');
if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);exit;}
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/relationships.php';
$actor=rs_start($conn);$method=$_SERVER['REQUEST_METHOD'];
if($actor['role']==='peserta_intensif')rs_student($conn,$actor);
if($method==='GET'){
 if(isset($_GET['id'])){$m=rs_meeting($conn,$actor,ac_id($_GET['id']));if(($_GET['view']??'')==='file')rs_file('materials',$m['material_file']??'','lms_materials');}
 $data=ac_rows($conn,'SELECT m.*,ta.class_id,ta.id AS assignment_id,c.name AS class_name FROM lms_meetings m LEFT JOIN lms_meeting_assignments ma ON ma.meeting_id=m.id LEFT JOIN lms_teaching_assignments ta ON ta.id=ma.assignment_id LEFT JOIN lms_classes c ON c.id=ta.class_id WHERE '.rs_meeting_filter($actor).' ORDER BY m.meeting_date,m.start_time,m.id');
 ed_respond(200,['status'=>'success','data'=>$data]);
}
if($method==='POST'){
 if(!rs_teacher($actor))ac_fail('Hanya pengajar/admin dapat mengelola pertemuan.',403);
 $d=json_decode(file_get_contents('php://input'),true)??$_POST;if(!is_array($d))ac_fail('Data tidak valid.');
 $data=ac_atomic($conn,function()use($conn,$actor,$d){
  ac_one($conn,'SELECT id FROM users WHERE id=? FOR UPDATE',[(int)$actor['id']]);$id=empty($d['id'])?null:ac_id($d['id']);$old=$id?rs_meeting($conn,$actor,$id):null;
  $title=ac_text($d['title']??$old['title']??'','Judul',255);$date=ac_date($d['meeting_date']??$old['meeting_date']??'');$assignment=rs_assignment($conn,$actor,ac_id($d['assignment_id']??$old['assignment_id']??null),$date);
  $type=$d['type']??$old['type']??'Masuk';if(!in_array($type,['Masuk','Libur','Ujian','Online'],true))ac_fail('Jenis pertemuan tidak valid.');
  $times=[];foreach(['start_time','end_time']as $key){$time=$d[$key]??$old[$key]??null;if($time==='')$time=null;if($time!==null&&!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/D',$time))ac_fail('Jam pertemuan tidak valid.');$times[]=$time;}
  if($type!=='Libur'&&(!$times[0]||!$times[1]||$times[1]<=$times[0]))ac_fail('Jam mulai dan selesai harus berurutan.');
  $hours=$d['duration_hours']??$old['duration_hours']??null;if($hours==='')$hours=null;if($hours!==null&&(!is_numeric($hours)||(float)$hours<=0||(float)$hours>24))ac_fail('Durasi tidak valid.');
  $file=rs_upload('material_file','materials')??$old['material_file']??null;$description=ac_text($d['description']??$old['description']??'','Deskripsi',10000,false);
  if($old&&$old['assignment_id']&&(int)$old['assignment_id']!==(int)$assignment['id']&&(ac_one($conn,'SELECT id FROM lms_attendance WHERE meeting_id=? LIMIT 1',[$id])||ac_one($conn,'SELECT id FROM lms_tasks WHERE meeting_id=? LIMIT 1',[$id])))ac_fail('Pertemuan yang memiliki histori tidak boleh dipindahkan kelas.',409);
  $params=[$title,$description,$date,...$times,(int)$assignment['sensei_user_id'],$type,$hours,$file];
  if($id)ac_query($conn,'UPDATE lms_meetings SET title=?,description=?,meeting_date=?,start_time=?,end_time=?,sensei_id=?,type=?,duration_hours=?,material_file=? WHERE id=?',[...$params,$id]);
  else{ac_query($conn,'INSERT INTO lms_meetings(title,description,meeting_date,start_time,end_time,sensei_id,type,duration_hours,material_file) VALUES(?,?,?,?,?,?,?,?,?)',$params);$id=$conn->insert_id;}
  ac_query($conn,'INSERT INTO lms_meeting_assignments(meeting_id,assignment_id,linked_by) VALUES(?,?,?) ON DUPLICATE KEY UPDATE assignment_id=VALUES(assignment_id),linked_by=VALUES(linked_by)',[$id,(int)$assignment['id'],(int)$actor['id']]);rs_audit($conn,$actor,'lms_meeting',$id,$old?'updated':'created',['assignment_id'=>(int)$assignment['id'],'type'=>$type]);return ['id'=>$id];
 });ed_respond(200,['status'=>'success','id'=>$data['id'],'data'=>$data]);
}
if($method==='DELETE'){rs_meeting($conn,$actor,ac_id($_GET['id']??null),true);ac_fail('Pertemuan dipertahankan untuk histori. Ubah jenis menjadi Libur untuk membatalkan.',409);}
ac_fail('Metode tidak diizinkan.',405);
