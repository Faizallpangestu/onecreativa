<?php
header('Content-Type: application/json; charset=utf-8');if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);exit;}
require_once __DIR__.'/../config/database.php';require_once __DIR__.'/../services/learning.php';
$a=rs_start($conn);$method=$_SERVER['REQUEST_METHOD'];if($a['role']==='peserta_intensif')rs_student($conn,$a);
if(isset($_GET['siswa_id'])&&$a['role']==='peserta_intensif'&&(int)$_GET['siswa_id']!==(int)$a['id'])ac_fail('Tidak dapat membaca data siswa lain.',403);
if($method==='GET'){
 if(($_GET['view']??'')==='file'){$s=ac_one($conn,'SELECT * FROM lms_submissions WHERE id=?',[ac_id($_GET['id']??null)]);if(!$s)ac_fail('Submission tidak ditemukan.',404);ls_task($conn,$a,(int)$s['task_id']);if($a['role']==='peserta_intensif'&&(int)$s['siswa_id']!==(int)$a['id'])ac_fail('Dokumen siswa lain tidak diizinkan.',403);rs_file('submissions',$s['submission_file']??'','lms_submissions');}
 ed_respond(200,['status'=>'success','data'=>ls_submissions($conn,$a,isset($_GET['task_id'])?ac_id($_GET['task_id']):null)]);
}
if($method==='POST'){$d=json_decode(file_get_contents('php://input'),true)??$_POST;if(!is_array($d))ac_fail('Data tidak valid.');$result=in_array($d['action']??'',['grade','publish'],true)?ls_grade($conn,$a,$d):ls_submit($conn,$a,$d);ed_respond(200,['status'=>'success','data'=>$result]);}
ac_fail('Metode tidak diizinkan.',405);
