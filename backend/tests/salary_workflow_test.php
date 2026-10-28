<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/salary_workflow.php';
require_once __DIR__ . '/salary_test_fixture.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$testName='one_creativa_salary_test_'.bin2hex(random_bytes(6));
$original=$conn->query('SELECT DATABASE()')->fetch_row()[0];
if (!preg_match('/^one_creativa_salary_test_[a-f0-9]{12}$/D',$testName) || $testName===$original) throw new RuntimeException('Invalid isolated database');
$conn->query("CREATE DATABASE `$testName`");$conn->select_db($testName);
$checks=0;
function verify(bool $condition,string $label):void { global $checks;if(!$condition)throw new RuntimeException('FAILED: '.$label);$checks++; }
function denied(callable $call,int $code,string $label):void { try{$call();}catch(SalaryWorkflowException $error){verify($error->getCode()===$code,$label);return;}throw new RuntimeException('FAILED: '.$label.' was allowed'); }
try {
    $month=(new DateTimeImmutable('first day of last month',new DateTimeZone('Asia/Jakarta')))->format('Y-m');
    install_salary_test_fixture($conn,$month);
    $finance=['id'=>1,'role'=>'finance','name'=>'Finance Uji'];$admin=['id'=>2,'role'=>'admin','name'=>'Admin Uji'];$ga=['id'=>3,'role'=>'ga','name'=>'GA Uji'];
    $preview=salary_preview($conn,$month);$byEmployee=array_column($preview,null,'employee_id');
    verify(count($preview)===3,'Only active employees/staff included, GA and inactive accounts excluded');
    verify($byEmployee[1]['work_days']===4 && $byEmployee[1]['meal_allowance']==='120000.00' && $byEmployee[1]['transport_allowance']==='80000.00','Distinct attendance: present, late, dinas; leave/absence excluded');
    verify($byEmployee[1]['total_salary']==='3200000.25' && $byEmployee[2]['total_salary']==='4500000.50','Different individual salaries plus exact daily allowances');
    verify($byEmployee[2]['work_days']===0 && $byEmployee[2]['meal_allowance']==='0.00','No attendance never falls back to 26 days');
    verify($byEmployee[3]['work_days']===1 && $byEmployee[3]['base_salary']==='2500000.00','Job salary fallback and attendance before joining excluded');
    verify(salary_period('2026-12')['payday']==='2027-01-04' && salary_period('2024-02')['period_end']==='2024-02-29','Payday next month 4 handles year change and leap year');
    denied(fn()=>salary_period("2026-09' OR 1=1"),422,'Invalid/injected month rejected');
    $input=['action'=>'prepare','employee_id'=>1,'month'=>$month,'base_salary'=>1,'work_days'=>100,'total_salary'=>1];
    denied(fn()=>salary_mutate($conn,$admin,$input),403,'Admin cannot prepare Finance request');
    denied(fn()=>salary_mutate($conn,$ga,$input),403,'GA cannot manage payroll');
    $draft=salary_mutate($conn,$finance,$input);
    verify($draft['total_salary']==='3200000.25' && $draft['status']==='draft' && $draft['account_number']==='001234','Server ignores client amounts and preserves leading bank zeros');
    $retry=salary_mutate($conn,$finance,$input);
    verify($retry['id']===$draft['id'] && count($retry['history'])===1,'One payroll per employee/month and idempotent prepare');
    $conn->query("INSERT INTO attendance_logs(employee_id,date,status) VALUES(1,'$month-08','dinas')");
    denied(fn()=>salary_mutate($conn,$finance,['action'=>'submit','id'=>$draft['id'],'version'=>$draft['version']]),409,'Changed attendance must be recalculated before submission');
    $fresh=salary_mutate($conn,$finance,['action'=>'refresh','id'=>$draft['id'],'version'=>$draft['version']]);
    verify((int)$fresh['work_days']===5 && $fresh['total_salary']==='3250000.25','Draft refresh reads actual attendance');
    verify((int)json_decode($fresh['history'][1]['snapshot_json'],true)['work_days']===4,'Previous calculation and attendance snapshot retained');
    denied(fn()=>salary_mutate($conn,$finance,['action'=>'submit','id'=>$fresh['id'],'version'=>1]),409,'Stale version cannot submit');
    $submitted=salary_mutate($conn,$finance,['action'=>'submit','id'=>$fresh['id'],'version'=>$fresh['version']]);
    verify($submitted['status']==='submitted' && $submitted['submitted_by_name']==='Finance Uji','Submission actor and timestamp stored');
    denied(fn()=>salary_mutate($conn,$finance,['action'=>'refresh','id'=>$submitted['id'],'version'=>$submitted['version']]),409,'Submitted salary and attendance locked');
    denied(fn()=>salary_mutate($conn,$finance,['action'=>'approve','id'=>$submitted['id'],'version'=>$submitted['version']]),403,'Finance cannot approve');
    denied(fn()=>salary_mutate($conn,$admin,['action'=>'reject','id'=>$submitted['id'],'version'=>$submitted['version'],'note'=>'']),422,'Rejection requires note');
    $rejected=salary_mutate($conn,$admin,['action'=>'reject','id'=>$submitted['id'],'version'=>$submitted['version'],'note'=>'Periksa kembali']);
    verify($rejected['status']==='rejected' && $rejected['finance_record_id']===null,'Rejected request produces no expense');
    $reopened=salary_mutate($conn,$finance,['action'=>'reopen','id'=>$rejected['id'],'version'=>$rejected['version']]);
    $submitted=salary_mutate($conn,$finance,['action'=>'submit','id'=>$reopened['id'],'version'=>$reopened['version']]);
    denied(fn()=>salary_mutate($conn,['id'=>1,'role'=>'admin','name'=>'Changed role'],['action'=>'approve','id'=>$submitted['id'],'version'=>$submitted['version']]),403,'Creator cannot approve own submission after role change');
    $approved=salary_mutate($conn,$admin,['action'=>'approve','id'=>$submitted['id'],'version'=>$submitted['version'],'note'=>'Sesuai']);
    verify($approved['status']==='approved' && $approved['finance_record_id']===null,'Approval schedules payment without pretending to transfer or creating expense');
    verify(salary_mutate($conn,$admin,['action'=>'approve','id'=>$submitted['id'],'version'=>$submitted['version']])['version']===$approved['version'],'Repeat approval does not duplicate history');
    denied(fn()=>salary_mutate($conn,$finance,['action'=>'pay','id'=>$approved['id'],'version'=>$approved['version'],'paid_date'=>salary_today(),'transfer_reference'=>'']),422,'Real bank transfer reference required');
    denied(fn()=>salary_mutate($conn,$finance,['action'=>'pay','id'=>$approved['id'],'version'=>$approved['version'],'paid_date'=>$month.'-03','transfer_reference'=>'TEST']),422,'Payment before scheduled payday denied');
    $tomorrow=(new DateTimeImmutable(salary_today()))->modify('+1 day')->format('Y-m-d');
    denied(fn()=>salary_mutate($conn,$finance,['action'=>'pay','id'=>$approved['id'],'version'=>$approved['version'],'paid_date'=>$tomorrow,'transfer_reference'=>'TEST']),422,'Future payment cannot be marked paid');
    $payment=['action'=>'pay','id'=>$approved['id'],'version'=>$approved['version'],'paid_date'=>salary_today(),'transfer_reference'=>'TEST-BANK-REF'];
    $conn->query("CREATE TRIGGER fail_salary_payment BEFORE INSERT ON salary_request_history FOR EACH ROW BEGIN IF NEW.action='pay' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Rollback test'; END IF; END");
    try{salary_mutate($conn,$finance,$payment);throw new RuntimeException('Expected injected failure');}catch(mysqli_sql_exception $error){verify($error->getMessage()==='Rollback test','Payment failure injected');}
    verify(salary_read($conn,(int)$approved['id'])['status']==='approved' && (int)$conn->query('SELECT COUNT(*) FROM finance_records')->fetch_row()[0]===0,'Failed payment rolls back expense/status/history');
    $conn->query('DROP TRIGGER fail_salary_payment');
    $workers=[];
    for($i=0;$i<2;$i++){$process=proc_open([PHP_BINARY,__DIR__.'/salary_payment_worker.php',$testName,json_encode($payment)],[['pipe','r'],['pipe','w'],['pipe','w']],$pipes);fclose($pipes[0]);$workers[]=[$process,$pipes];}
    $results=[];foreach($workers as [$process,$pipes]){$output=stream_get_contents($pipes[1]);$error=stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);verify(proc_close($process)===0&&!$error,'Concurrent payment worker succeeded');$results[]=json_decode($output,true);}
    verify($results[0]['finance_record_id']===$results[1]['finance_record_id'],'Concurrent payment confirmations return same expense');
    $paid=salary_read($conn,(int)$approved['id']);$expense=$conn->query('SELECT * FROM finance_records')->fetch_assoc();
    verify($paid['status']==='paid' && $paid['transfer_reference']==='TEST-BANK-REF' && $expense['type']==='expense' && $expense['amount']==='3250000.25','Confirmed payment creates one exact expense and bank reference');
    verify((int)$conn->query('SELECT COUNT(*) FROM finance_records')->fetch_row()[0]===1 && count(array_filter($paid['history'],fn($event)=>$event['action']==='pay'))===1,'Duplicate confirmations cannot duplicate expense or payment audit');
    $second=salary_mutate($conn,$finance,['action'=>'prepare','employee_id'=>2,'month'=>$month]);
    denied(fn()=>salary_mutate($conn,$finance,['action'=>'submit','id'=>$second['id'],'version'=>$second['version']]),422,'Incomplete bank details block submission');
    $second=salary_mutate($conn,$finance,['action'=>'refresh','id'=>$second['id'],'version'=>$second['version'],'bank_name'=>'Bank Uji','account_name'=>'Karyawan Uji Dua','account_number'=>'009876']);
    verify((int)$second['work_days']===0 && $second['total_salary']==='4500000.50','Zero attendance retains only base salary when saving bank data');
    $ongoing=salary_mutate($conn,$finance,['action'=>'prepare','employee_id'=>1,'month'=>substr(salary_today(),0,7)]);
    denied(fn()=>salary_mutate($conn,$finance,['action'=>'submit','id'=>$ongoing['id'],'version'=>$ongoing['version']]),409,'Incomplete attendance month cannot be submitted');
    $oldMonth=(new DateTimeImmutable($month.'-01'))->modify('-1 month')->format('Y-m');
    $conn->query("INSERT INTO payslips(employee_id,month,status,base_salary,total_salary) VALUES(2,'$oldMonth','published',4500000,4500000)");
    denied(fn()=>salary_mutate($conn,$finance,['action'=>'prepare','employee_id'=>2,'month'=>$oldMonth]),409,'Already published legacy period cannot be paid twice');
    require __DIR__.'/salary_http_checks.php';salary_http_checks($conn,$testName,$month,(int)$paid['id'],(int)$expense['id']);
    echo "PASS: $checks salary workflow checks.\n";
} finally {$conn->select_db($original);$conn->query("DROP DATABASE `$testName`");}
