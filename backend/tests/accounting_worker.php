<?php
if(PHP_SAPI!=='cli')exit;
require_once __DIR__.'/../config/database.php';require_once __DIR__.'/../services/budget_realization.php';
if(!preg_match('/^one_creativa_accounting_test_[a-f0-9]{12}$/D',$argv[1]??''))exit(2);
$conn->select_db($argv[1]);mysqli_report(MYSQLI_REPORT_ERROR|MYSQLI_REPORT_STRICT);
try{$result=ac_budget_realize($conn,['id'=>1,'role'=>'finance','name'=>'Finance'],json_decode(base64_decode($argv[2]),true));echo json_encode(['status'=>'success','result'=>$result]);}
catch(AccountingException $e){echo json_encode(['status'=>'error','code'=>$e->getCode()]);}
