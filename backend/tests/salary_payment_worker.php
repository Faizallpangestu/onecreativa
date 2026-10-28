<?php
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
$testName=$argv[1]??'';
if(!preg_match('/^one_creativa_salary_test_[a-f0-9]{12}$/D',$testName))exit(1);
require __DIR__.'/../config/database.php';require __DIR__.'/../services/salary_workflow.php';
$conn->select_db($testName);$conn->query("SET time_zone='+07:00'");
echo json_encode(salary_mutate($conn,['id'=>1,'role'=>'finance','name'=>'Finance Uji'],json_decode($argv[2],true,512,JSON_THROW_ON_ERROR)));
