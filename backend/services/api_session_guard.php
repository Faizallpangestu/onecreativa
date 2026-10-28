<?php
require_once __DIR__.'/../config/session.php';
require_once __DIR__.'/accounting_core.php';
function api_session_guard(mysqli $db,?string $permission='read'):array {
    header('Cache-Control: no-store, private');
    try{$actor=session_actor($db);if(!$actor)ac_fail('Silakan login kembali.',401);if($permission)ac_require($db,$actor,$permission);
        if(!in_array($_SERVER['REQUEST_METHOD'],['GET','HEAD','OPTIONS'],true)&&(!($_SESSION['csrf_token']??'')||!hash_equals($_SESSION['csrf_token'],$_SERVER['HTTP_X_CSRF_TOKEN']??'')))ac_fail('Token sesi tidak valid. Muat ulang halaman.',403);
        session_write_close();return $actor;
    }catch(AccountingException $e){http_response_code($e->getCode());echo json_encode(['status'=>'error','message'=>$e->getMessage()]);exit;}
}
