<?php
header('Content-Type: application/json; charset=utf-8');if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);exit;}
require_once __DIR__.'/../config/database.php';require_once __DIR__.'/../services/learning_attendance.php';
$a=rs_start($conn);if($a['role']==='peserta_intensif')rs_student($conn,$a);if(isset($_GET['siswa_id'])&&$a['role']==='peserta_intensif'&&(int)$_GET['siswa_id']!==(int)$a['id'])ac_fail('Tidak dapat membaca presensi siswa lain.',403);
if($_SERVER['REQUEST_METHOD']==='GET')ed_respond(200,['status'=>'success','data'=>la_rows($conn,$a,isset($_GET['meeting_id'])?ac_id($_GET['meeting_id']):null)]);
if($_SERVER['REQUEST_METHOD']==='POST'){$d=json_decode(file_get_contents('php://input'),true)??$_POST;if(!is_array($d))ac_fail('Data tidak valid.');$result=($d['action']??'')==='issue_session'?la_issue($conn,$a,ac_id($d['meeting_id']??null)):la_save($conn,$a,$d);ed_respond(200,['status'=>'success','data'=>$result]);}
if($_SERVER['REQUEST_METHOD']==='DELETE')ac_fail('Presensi dipertahankan untuk histori. Gunakan koreksi status yang diaudit.',409);
ac_fail('Metode tidak diizinkan.',405);
