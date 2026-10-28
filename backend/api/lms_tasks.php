<?php
header('Content-Type: application/json; charset=utf-8');
if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);exit;}
require_once __DIR__.'/../config/database.php';require_once __DIR__.'/../services/relationships.php';
$actor=rs_start($conn);$method=$_SERVER['REQUEST_METHOD'];if($actor['role']==='peserta_intensif')rs_student($conn,$actor);
if($method==='GET'){
 if(isset($_GET['meeting_id']))rs_meeting($conn,$actor,ac_id($_GET['meeting_id']));
 if(isset($_GET['id'])){$task=ac_one($conn,'SELECT * FROM lms_tasks WHERE id=?',[ac_id($_GET['id'])]);if(!$task)ac_fail('Tugas tidak ditemukan.',404);rs_meeting($conn,$actor,(int)$task['meeting_id']);if(($_GET['view']??'')==='file')rs_file('tasks',$task['file_attachment']??'','lms_tasks');}
 $filter=isset($_GET['meeting_id'])?' AND t.meeting_id='.(int)$_GET['meeting_id']:'';
 $rows=ac_rows($conn,'SELECT t.*,m.title AS meeting_title,m.meeting_date,c.name AS class_name,ta.class_id FROM lms_tasks t JOIN lms_meetings m ON m.id=t.meeting_id LEFT JOIN lms_meeting_assignments ma ON ma.meeting_id=m.id LEFT JOIN lms_teaching_assignments ta ON ta.id=ma.assignment_id LEFT JOIN lms_classes c ON c.id=ta.class_id WHERE '.rs_meeting_filter($actor).$filter.' ORDER BY t.created_at DESC');ed_respond(200,['status'=>'success','data'=>$rows]);
}
if($method==='POST'){
 if(!rs_teacher($actor))ac_fail('Hanya pengajar/admin dapat menerbitkan tugas.',403);$d=json_decode(file_get_contents('php://input'),true)??$_POST;
 $data=ac_atomic($conn,function()use($conn,$actor,$d){$meeting=ac_id($d['meeting_id']??null);ac_one($conn,'SELECT id FROM lms_meetings WHERE id=? FOR UPDATE',[$meeting]);rs_meeting($conn,$actor,$meeting,true);$title=ac_text($d['title']??'','Judul',255);$cat=$d['category']??'tugas';if(!in_array($cat,['tugas','quiz','ukom','materi','konsultasi'],true))ac_fail('Kategori pembelajaran tidak valid.');$due=empty($d['due_date'])?null:str_replace('T',' ',$d['due_date']);if($due&&strlen($due)===16)$due.=':00';if($due){$parsed=DateTimeImmutable::createFromFormat('!Y-m-d H:i:s',$due);if(!$parsed||$parsed->format('Y-m-d H:i:s')!==$due)ac_fail('Deadline tidak valid.');}$file=rs_upload('file_attachment','tasks');ac_query($conn,'INSERT INTO lms_tasks(meeting_id,title,description,due_date,file_attachment,category) VALUES(?,?,?,?,?,?)',[$meeting,$title,ac_text($d['description']??'','Deskripsi',10000,false),$due,$file,$cat]);$id=$conn->insert_id;rs_audit($conn,$actor,'lms_task',$id,'published',['meeting_id'=>$meeting,'category'=>$cat]);return ['id'=>$id];});ed_respond(200,['status'=>'success','data'=>$data]);
}
if($method==='DELETE'){if(!rs_teacher($actor))ac_fail('Akses ditolak.',403);ac_fail('Tugas dan submission dipertahankan untuk histori.',409);}
ac_fail('Metode tidak diizinkan.',405);
