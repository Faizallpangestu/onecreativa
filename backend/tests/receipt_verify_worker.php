<?php
if (PHP_SAPI!=='cli') { http_response_code(404); exit; }
[$database,$file,$barrier]=array_slice($argv,1)+[null,null,null];
if (!preg_match('/^one_creativa_accounting_test_[a-f0-9]{12}$/D',$database ?? '')) exit(1);
foreach ([$file,$barrier] as $path) if (realpath(dirname($path))!==realpath(sys_get_temp_dir()) || !str_starts_with(basename($path),$database.'_')) exit(1);
[$host,$name]=(static function(){ $DB_HOST='localhost';$DB_NAME='one-creativa';if(is_file(__DIR__.'/../config/db_env.php'))require __DIR__.'/../config/db_env.php';return [$DB_HOST,$DB_NAME];})();
if (!in_array($host,['localhost','127.0.0.1','::1'],true) || !preg_match('/(?:_dev|_test)$/D',$name)) exit(1);
$_SERVER['HTTP_HOST']='127.0.0.1';
require __DIR__.'/../config/database.php';require __DIR__.'/../services/billing_receipts.php';$conn->select_db($database);
$input=json_decode(file_get_contents($file),true);
for($i=0;$i<100 && !is_file($barrier);$i++)usleep(50000);
if(!is_file($barrier))exit(1);
try {echo json_encode(['code'=>200,'data'=>bp_verify($conn,['id'=>$input['actor'],'role'=>'finance','name'=>'Local worker'],$input['body'])]);}
catch(Throwable $e){echo json_encode(['code'=>$e instanceof AccountingException?$e->getCode():500,'error'=>$e->getMessage()]);}
