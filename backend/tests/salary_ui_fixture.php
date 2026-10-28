<?php
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/../config/database.php';require __DIR__.'/salary_test_fixture.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$testName='one_creativa_salary_test_'.bin2hex(random_bytes(6));$original=$conn->query('SELECT DATABASE()')->fetch_row()[0];
if(!preg_match('/^one_creativa_salary_test_[a-f0-9]{12}$/D',$testName)||$testName===$original)throw new RuntimeException('Invalid fixture database');
$readyPath=$argv[1]??'';
if(realpath(dirname($readyPath))!==realpath(sys_get_temp_dir())||!preg_match('/^creativa-salary-ui-[a-z0-9-]+\.json$/D',basename($readyPath)))throw new RuntimeException('Fixture path must be in temporary directory');
$stopPath=$readyPath.'.stop';$server=null;$logPath=tempnam(sys_get_temp_dir(),'salary-ui-');
$conn->query("CREATE DATABASE `$testName`");$conn->select_db($testName);
try{
    $month=(new DateTimeImmutable('first day of last month',new DateTimeZone('Asia/Jakarta')))->format('Y-m');install_salary_test_fixture($conn,$month);
    $socket=stream_socket_server('tcp://127.0.0.1:0',$errno,$errstr);$address=stream_socket_get_name($socket,false);fclose($socket);$port=(int)substr($address,strrpos($address,':')+1);
    putenv("CREATIVA_RAB_TEST_DB=$testName");
    $server=proc_open([PHP_BINARY,'-d','session.save_path='.sys_get_temp_dir(),'-S',"127.0.0.1:$port",__DIR__.'/budget_test_router.php'],[['pipe','r'],['file',$logPath,'a'],['file',$logPath,'a']],$pipes,dirname(__DIR__,2));
    if(!is_resource($server))throw new RuntimeException('Fixture server failed');fclose($pipes[0]);
    if(file_exists($stopPath))unlink($stopPath);
    file_put_contents($readyPath,json_encode(['url'=>"http://127.0.0.1:$port/",'stopPath'=>$stopPath,'month'=>$month]));echo "Isolated salary UI fixture ready.\n";
    $deadline=time()+300;while(time()<$deadline&&!file_exists($stopPath))usleep(200000);
}finally{
    if(is_resource($server)){proc_terminate($server);proc_close($server);}unlink($logPath);
    $conn->select_db($original);$conn->query("DROP DATABASE `$testName`");
    if(file_exists($readyPath))unlink($readyPath);if(file_exists($stopPath))unlink($stopPath);echo "Isolated salary UI fixture removed.\n";
}
