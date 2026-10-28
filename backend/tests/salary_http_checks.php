<?php
function salary_http_checks(mysqli $db,string $testName,string $month,int $paidId,int $expenseId):void {
    $socket=stream_socket_server('tcp://127.0.0.1:0',$errno,$errstr);$address=stream_socket_get_name($socket,false);fclose($socket);$port=(int)substr($address,strrpos($address,':')+1);
    putenv("CREATIVA_RAB_TEST_DB=$testName");$logPath=tempnam(sys_get_temp_dir(),'salary-http-');
    $server=proc_open([PHP_BINARY,'-d','session.save_path='.sys_get_temp_dir(),'-S',"127.0.0.1:$port",__DIR__.'/budget_test_router.php'],[['pipe','r'],['file',$logPath,'a'],['file',$logPath,'a']],$pipes,dirname(__DIR__,2));
    if(!is_resource($server))throw new RuntimeException('Cannot start salary API test');fclose($pipes[0]);
    try {
        for($i=0;$i<60;$i++){$ready=@stream_socket_client("tcp://127.0.0.1:$port",$errno,$errstr,.1);if($ready){fclose($ready);break;}usleep(100000);}
        $send=function(string $endpoint,string $method='GET',?array $data=null,string $cookie='',string $csrf='')use($port):array{
            $headers=['Content-Type: application/json'];if($cookie)$headers[]='Cookie: '.$cookie;if($csrf)$headers[]='X-CSRF-Token: '.$csrf;
            $context=stream_context_create(['http'=>['method'=>$method,'header'=>implode("\r\n",$headers),'content'=>$data===null?'':json_encode($data),'ignore_errors'=>true,'timeout'=>10]]);
            $body=file_get_contents("http://127.0.0.1:$port/".$endpoint,false,$context);$responseHeaders=$http_response_header??[];preg_match('/\s(\d{3})\s/',$responseHeaders[0]??'',$match);
            $cookie='';foreach($responseHeaders as $header)if(stripos($header,'Set-Cookie:')===0)$cookie=explode(';',trim(substr($header,11)))[0];
            $json=json_decode($body,true);if(!is_array($json))throw new RuntimeException('Invalid API JSON: '.substr($body,0,250));
            return ['code'=>(int)($match[1]??0),'json'=>$json,'cookie'=>$cookie];
        };
        verify($send('salaries.php')['code']===401 && $send('payroll.php')['code']===401,'Salary and payslip APIs require authenticated session');
        $finance=$send('login.php','POST',['email'=>'finance@test','password'=>'isolated-test-only'])['cookie'];
        $list=$send('salaries.php?month='.$month,'GET',null,$finance)['json'];$csrf=$list['csrf_token'];
        verify($list['permissions']['can_prepare']&&!$list['permissions']['can_approve']&&count($list['data']['preview'])===3,'Finance sees actual employee attendance and submit-only permissions');
        $input=['action'=>'prepare','employee_id'=>3,'month'=>$month,'base_salary'=>1,'total_salary'=>1,'user_id'=>2,'role'=>'admin'];
        verify($send('salaries.php','POST',$input,$finance)['code']===403,'Payroll mutation requires CSRF');
        $draft=$send('salaries.php','POST',$input,$finance,$csrf)['json']['data'];
        verify($draft['created_by_name']==='finance@test'&&$draft['total_salary']==='2550000.00','Server identity and salary calculation cannot be spoofed');
        $submitted=$send('salaries.php','POST',['action'=>'submit','id'=>$draft['id'],'version'=>$draft['version']],$finance,$csrf)['json']['data'];
        $decision=['action'=>'approve','id'=>$submitted['id'],'version'=>$submitted['version']];
        verify($send('salaries.php','POST',$decision,$finance,$csrf)['code']===403,'Finance cannot approve through HTTP');
        $admin=$send('login.php','POST',['email'=>'admin@test','password'=>'isolated-test-only'])['cookie'];
        $adminList=$send('salaries.php?month='.$month,'GET',null,$admin)['json'];
        $approved=$send('salaries.php','POST',$decision,$admin,$adminList['csrf_token'])['json']['data'];
        verify($approved['status']==='approved' && $approved['reviewed_by_name']==='admin@test' && $approved['finance_record_id']===null,'Admin approves individual employee without creating expense before transfer');
        verify($db->query('SELECT status FROM salary_requests WHERE employee_id=2')->fetch_row()[0]==='draft','Approving one employee does not approve another employee');
        $paidPreview=$send('salary_slips.php?id='.$paidId,'GET',null,$finance)['json']['data'];
        $published=$send('salary_slips.php','POST',['action'=>'publish','id'=>$paidId,'version'=>$paidPreview['salary_version'],'preview_token'=>$paidPreview['preview_token'],'checked'=>true],$finance,$csrf);
        verify($published['code']===200 && $published['json']['data']['published'],'Finance verifies and publishes paid salary before employee access');
        $employee=$send('login.php','POST',['email'=>'employee@example.test','password'=>'isolated-test-only'])['cookie'];
        $slip=$send('payroll.php?month='.$month.'&employee_id=1','GET',null,$employee);
        verify($slip['code']===200&&count($slip['json']['data'])===1&&$slip['json']['data'][0]['uang_makan']==='150000.00'&&$slip['json']['data'][0]['uang_transport']==='100000.00','Own paid slip includes meal and transport amounts');
        verify($send('dashboard_karyawan.php?user_id=4','GET',null,$employee)['json']['data']['gaji']['net_salary']==='3250000.25','Employee dashboard shows latest confirmed salary');
        verify($send('dashboard_karyawan.php?user_id=5','GET',null,$employee)['code']===403,'Employee cannot read another dashboard/salary through user_id');
        verify($send('payroll.php?month='.$month.'&employee_id=2&role=finance','GET',null,$employee)['code']===403,'Employee cannot read another salary by spoofing role/id');
        verify($send('salaries.php?all=1','GET',null,$employee)['code']===403,'Employee cannot read Finance payroll history');
        $staff=$send('login.php','POST',['email'=>'staff@example.test','password'=>'isolated-test-only'])['cookie'];
        verify(count($send('payroll.php?month='.$month,'GET',null,$staff)['json']['data'])===0,'Approval alone does not publish slip without Finance verification');
        $paid=$send('salaries.php','POST',['action'=>'pay','id'=>$approved['id'],'version'=>$approved['version'],'paid_date'=>salary_today(),'transfer_reference'=>'HTTP-TEST-REF'],$finance,$csrf)['json']['data'];
        verify($paid['status']==='paid'&&$paid['finance_record_id']!==null,'Finance records actual transfer through authenticated HTTP');
        verify(count($send('payroll.php?month='.$month,'GET',null,$staff)['json']['data'])===0,'Transfer alone does not bypass Finance slip verification');
        $staffPreview=$send('salary_slips.php?id='.$paid['id'],'GET',null,$finance)['json']['data'];
        $send('salary_slips.php','POST',['action'=>'publish','id'=>$paid['id'],'version'=>$staffPreview['salary_version'],'preview_token'=>$staffPreview['preview_token'],'checked'=>true],$finance,$csrf);
        verify(count($send('payroll.php?month='.$month,'GET',null,$staff)['json']['data'])===1,'Slip becomes visible after Finance publishes reviewed document');
        verify($send('finance.php?id='.$expenseId,'PUT',['amount'=>1],$finance,$csrf)['code']===409 && $send('finance.php?id='.$expenseId,'DELETE',null,$finance,$csrf)['code']===409,'Linked salary expense cannot be edited/deleted');
        verify($send('finance.php?type=expense')['code']===401 && count($send('finance.php?type=expense','GET',null,$finance)['json']['data'])===2,'Payroll expense/bank details hidden from unauthenticated readers and visible to Finance');
        $all=$send('salaries.php?all=1','GET',null,$admin)['json']['data']['requests'];
        verify(count($all)>=4 && count($send('salaries.php?id='.$paidId,'GET',null,$admin)['json']['data']['history'])>=7,'All-month history and event snapshots available to Admin');
        $hrd=$send('login.php','POST',['email'=>'hrd@test','password'=>'isolated-test-only'])['cookie'];
        $hrPreview=$send('payroll.php?role=hrd&month='.$month,'GET',null,$hrd)['json']['data'];
        $hrByEmployee=array_column($hrPreview,null,'employee_id');
        verify(count($hrPreview)===3&&$hrByEmployee[1]['uang_makan']==='150000.00','HRD reads same attendance formula without controlling approvals');
        verify($send('save_payroll.php','POST',['month'=>$month],$hrd)['code']===410&&$send('publish_payroll.php','POST',['month'=>$month],$finance)['code']===410,'Legacy writers cannot bypass Admin approval');
        $ga=$send('login.php','POST',['email'=>'ga@test','password'=>'isolated-test-only'])['cookie'];
        verify($send('salaries.php','GET',null,$ga)['code']===403,'GA has no payroll management access');
        $master=$send('salaries.php?view=base_salary&month='.$month,'GET',null,$finance)['json'];
        verify(count($master['data']['employees'])===3 && $master['csrf_token']===$csrf,'Master salary settings use same authenticated session and CSRF');
        $next=(new DateTimeImmutable($month.'-01'))->modify('+1 month')->format('Y-m');
        $rate=['action'=>'set_base_salary','employee_id'=>2,'effective_month'=>$next,'amount'=>'5000000.25','reason'=>'HTTP test salary setting','revision'=>0,'actor_id'=>2,'actor_name'=>'Spoofed Admin','role'=>'admin'];
        verify($send('salaries.php','POST',$rate,$finance)['code']===403,'Base salary setting requires CSRF');
        verify($send('salaries.php','POST',$rate,$employee,$send('salaries.php?view=base_salary','GET',null,$employee)['json']['csrf_token']??'')['code']===403,'Employee cannot change base salary through HTTP');
        $savedRate=$send('salaries.php','POST',$rate,$finance,$csrf);
        verify($savedRate['code']===200 && $savedRate['json']['data']['amount']==='5000000.25','Finance can schedule individual salary through HTTP');
        $master=$send('salaries.php?view=base_salary&month='.$next,'GET',null,$admin)['json'];
        $byEmployee=array_column($master['data']['employees'],null,'employee_id');
        verify($byEmployee[2]['base_salary']==='5000000.25' && $byEmployee[2]['history'][0]['actor_name']==='finance@test' && $byEmployee[2]['history'][0]['actor_role']==='finance','Salary change audit uses verified server actor instead of client identity');
        verify($send('salaries.php','POST',$rate,$finance,$csrf)['code']===409,'Stale base salary edits rejected through HTTP');
        verify($send('salaries.php?view=base_salary','GET',null,$employee)['code']===403 && $send('salaries.php?view=base_salary')['code']===401,'Salary master hidden from employees and anonymous requests');
        verify($send('logout.php','POST',[],$finance,$csrf)['code']===200&&$send('salaries.php','GET',null,$finance)['code']===401,'Logout invalidates payroll session');
    } finally {proc_terminate($server);proc_close($server);unlink($logPath);putenv('CREATIVA_RAB_TEST_DB');}
}
