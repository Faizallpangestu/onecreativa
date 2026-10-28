<?php
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store, private');
require_once __DIR__.'/../config/database.php';require_once __DIR__.'/../config/session.php';
$actor=session_actor($conn);if(!$actor){http_response_code(401);echo json_encode(['status'=>'error','message'=>'Silakan login kembali.']);exit;}
if(empty($_SESSION['csrf_token']))$_SESSION['csrf_token']=bin2hex(random_bytes(32));
echo json_encode(['status'=>'success','actor'=>$actor,'csrf_token'=>$_SESSION['csrf_token']]);session_write_close();
