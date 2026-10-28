<?php
header('Content-Type: application/json; charset=utf-8');require_once __DIR__.'/../config/database.php';require_once __DIR__.'/../services/learning_dashboard.php';
$a=rs_start($conn,['peserta_intensif']);if($_SERVER['REQUEST_METHOD']!=='GET')ac_fail('Metode tidak diizinkan.',405);rs_student($conn,$a);if(isset($_GET['siswa_id'])&&(int)$_GET['siswa_id']!==(int)$a['id'])ac_fail('Tidak dapat membaca statistik siswa lain.',403);
ed_respond(200,['status'=>'success','data'=>ls_dashboard($conn,$a)]);
