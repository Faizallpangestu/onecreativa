<?php
header('Content-Type: application/json; charset=utf-8');if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);exit;}
require_once __DIR__.'/../config/database.php';require_once __DIR__.'/../services/learning.php';
$a=rs_start($conn);if($a['role']==='peserta_intensif')rs_student($conn,$a);
if($_SERVER['REQUEST_METHOD']==='GET')ed_respond(200,['status'=>'success','data'=>ls_grades($conn,$a)]);
if($_SERVER['REQUEST_METHOD']==='POST'){$d=json_decode(file_get_contents('php://input'),true);if(!is_array($d))ac_fail('JSON tidak valid.');ed_respond(200,['status'=>'success','data'=>ls_summary_save($conn,$a,$d)]);}
ac_fail('Metode tidak diizinkan.',405);
