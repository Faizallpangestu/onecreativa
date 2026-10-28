<?php
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../config/session.php';
require_once __DIR__.'/../services/accounting_core.php';
if($_SERVER['REQUEST_METHOD']!=='POST')ac_fail('Method not allowed.',405);
start_app_session();
$token=$_SERVER['HTTP_X_CSRF_TOKEN']??'';
if(!is_string($token)||!isset($_SESSION['csrf_token'])||!hash_equals($_SESSION['csrf_token'],$token))ac_fail('Token sesi tidak valid.',403);
$_SESSION=[];session_destroy();setcookie(session_name(),'', ['expires'=>time()-3600,'path'=>'/','httponly'=>true,'samesite'=>'Lax','secure'=>!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off']);
echo json_encode(['status'=>'success']);
