<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
date_default_timezone_set(getenv('CREATIVA_TIMEZONE') ?: 'Asia/Jakarta');
if(PHP_SAPI!=='cli'){
 header('Content-Type: application/json; charset=utf-8');
 header('Cache-Control: no-store, private');
 header('X-Content-Type-Options: nosniff');
 $GLOBALS['api_request_id']=bin2hex(random_bytes(8));
 header('X-Request-ID: '.$GLOBALS['api_request_id']);
 ini_set('display_errors','0');
 ob_start(function(string $body):string{
  return $body;
 });
 set_exception_handler(function(Throwable $e){
  error_log(json_encode(['request_id'=>$GLOBALS['api_request_id'],'module'=>'api','error_class'=>get_class($e),'error_code'=>$e->getCode(),'message'=>$e->getMessage()]));
  $code=$e instanceof AccountingException?$e->getCode():500;
  if($e instanceof mysqli_sql_exception&&$e->getCode()===1062)$code=409;
  http_response_code($code);
  $msg=$e instanceof mysqli_sql_exception&&$e->getCode()===1062?'Email atau NIK telah dipakai.':$e->getMessage();
  echo json_encode(['status'=>'error','message'=>$msg,'request_id'=>$GLOBALS['api_request_id']]);
 });
}
$envFile=__DIR__.'/db_env.php';
if(is_file($envFile)){require $envFile;}else{
 if(PHP_SAPI!=='cli'){
  $host=strtolower(parse_url('http://'.($_SERVER['HTTP_HOST']??''),PHP_URL_HOST)??'');
  if(!in_array($host,['localhost','127.0.0.1','[::1]'],true))throw new RuntimeException('Production database configuration is required.');
 }
 $DB_HOST = 'localhost';
 $DB_USER = 'root';
 $DB_PASS = '';
 $DB_NAME = 'one-creativa';
}
$conn=new mysqli($DB_HOST,$DB_USER,$DB_PASS,$DB_NAME);
$conn->set_charset('utf8mb4');
$conn->query("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
$conn->query("SET collation_connection = 'utf8mb4_general_ci'");
// Database schemas are installed by reviewed CLI migrations, never by an API read.
if(PHP_SAPI!=='cli'&&!defined('CREATIVA_TEST_ROUTER')){
 require_once __DIR__.'/../services/api_entry_policy.php';
 api_entry_policy($conn);
}
