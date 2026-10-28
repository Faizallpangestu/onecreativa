<?php
header('Content-Type: application/json; charset=utf-8');require_once __DIR__.'/../config/database.php';require_once __DIR__.'/../services/learning_dashboard.php';
$a=rs_start($conn,['admin','super_admin','sensei']);if($_SERVER['REQUEST_METHOD']!=='GET')ac_fail('Metode tidak diizinkan.',405);
ed_respond(200,['status'=>'success','data'=>ls_dashboard($conn,$a)]);
