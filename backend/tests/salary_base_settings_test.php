<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/salary_workflow.php';
require_once __DIR__.'/salary_test_fixture.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$testName='one_creativa_salary_test_'.bin2hex(random_bytes(6));
$original=$conn->query('SELECT DATABASE()')->fetch_row()[0];
if (!preg_match('/^one_creativa_salary_test_[a-f0-9]{12}$/D',$testName) || $testName===$original) throw new RuntimeException('Invalid isolated database');
$conn->query("CREATE DATABASE `$testName`"); $conn->select_db($testName);
$checks=0;
function verify(bool $condition,string $label):void { global $checks; if (!$condition) throw new RuntimeException('FAILED: '.$label); $checks++; }
function denied(callable $call,int $code,string $label):void { try {$call();} catch (SalaryWorkflowException $error) { verify($error->getCode()===$code,$label); return; } throw new RuntimeException('FAILED: '.$label.' was allowed'); }
try {
    $month=(new DateTimeImmutable('first day of last month',new DateTimeZone('Asia/Jakarta')))->format('Y-m');
    $next=(new DateTimeImmutable($month.'-01'))->modify('+1 month')->format('Y-m');
    install_salary_test_fixture($conn,$month);
    $finance=['id'=>1,'role'=>'finance','name'=>'Finance Uji']; $admin=['id'=>2,'role'=>'admin','name'=>'Admin Uji'];
    $preview=fn(string $period)=>array_column(salary_preview($conn,$period),null,'employee_id');
    $settings=salary_base_settings($conn,$month);
    verify(count($settings['employees'])===3 && !isset($settings['employees'][0]['account_number']),'Active employee master excludes bank details');
    $draft=salary_mutate($conn,$finance,['action'=>'prepare','employee_id'=>1,'month'=>$month]);
    $input=['employee_id'=>1,'effective_month'=>$next,'amount'=>'4000000.75','reason'=>'Kenaikan bulan depan','revision'=>0];
    denied(fn()=>salary_set_base_rate($conn,['id'=>3,'role'=>'ga','name'=>'GA'],$input),403,'GA cannot change base salary');
    denied(fn()=>salary_set_base_rate($conn,['id'=>4,'role'=>'karyawan','name'=>'Employee'],$input),403,'Employee cannot change own salary');
    denied(fn()=>salary_set_base_rate($conn,$finance,array_merge($input,['amount'=>'0'])),422,'Zero salary rejected');
    denied(fn()=>salary_set_base_rate($conn,$finance,array_merge($input,['amount'=>'-1'])),422,'Negative salary rejected');
    denied(fn()=>salary_set_base_rate($conn,$finance,array_merge($input,['reason'=>''])),422,'Change reason required');
    denied(fn()=>salary_set_base_rate($conn,$finance,array_merge($input,['effective_month'=>'2026-13'])),422,'Invalid effective month rejected');
    denied(fn()=>salary_set_base_rate($conn,$finance,array_diff_key($input,['revision'=>true])),409,'Revision required');
    denied(fn()=>salary_set_base_rate($conn,$finance,array_merge($input,['employee_id'=>5])),404,'Operational login is not employee salary master');
    $future=salary_set_base_rate($conn,$finance,$input);
    verify($preview($month)[1]['base_salary']==='3000000.25','Future increase preserves prior month base');
    verify($preview($next)[1]['base_salary']==='4000000.75','Future month selects scheduled increase');
    verify($preview('2027-01')[1]['base_salary']==='4000000.75','Rate continues across months and year boundary');
    verify($preview($next)[2]['base_salary']==='4500000.50' && $preview($next)[3]['base_salary']==='2500000.00','Other individual and position rates unchanged');
    denied(fn()=>salary_set_base_rate($conn,$finance,$input),409,'Stale editor cannot overwrite salary master');
    $current=salary_set_base_rate($conn,$admin,['employee_id'=>1,'effective_month'=>$month,'amount'=>'3500000.50','reason'=>'Penetapan gaji individu','revision'=>$future['id']]);
    verify($preview($month)[1]['total_salary']==='3700000.50' && $preview($month)[1]['work_days']===4,'Individual base plus exact 30k meal and 20k transport per attendance date');
    verify($preview($next)[1]['base_salary']==='4000000.75','Earlier effective change preserves later schedule');
    verify(salary_read($conn,(int)$draft['id'])['base_salary']==='3000000.25','Saving master does not silently rewrite draft');
    denied(fn()=>salary_mutate($conn,$finance,['action'=>'submit','id'=>$draft['id'],'version'=>$draft['version']]),409,'Changed base blocks submission until recalculation');
    $draft=salary_mutate($conn,$finance,['action'=>'refresh','id'=>$draft['id'],'version'=>$draft['version']]);
    verify($draft['base_salary']==='3500000.50' && (int)$draft['base_salary_rate_id']===$current['id'] && $draft['base_salary_effective_month']===$month,'Draft snapshot records amount, rate ID and effective month');
    verify(json_decode($draft['history'][1]['snapshot_json'],true)['base_salary']==='3000000.25','Earlier draft calculation remains in history');
    $submitted=salary_mutate($conn,$finance,['action'=>'submit','id'=>$draft['id'],'version'=>$draft['version']]);
    $revision=['employee_id'=>1,'effective_month'=>$month,'amount'=>'3600000.50','reason'=>'Revisi gaji','revision'=>$current['id']];
    denied(fn()=>salary_set_base_rate($conn,$finance,$revision),409,'Submitted period cannot be retroactively changed');
    verify(salary_read($conn,(int)$draft['id'])['total_salary']==='3700000.50','Submitted total remains immutable');
    $rejected=salary_mutate($conn,$admin,['action'=>'reject','id'=>$submitted['id'],'version'=>$submitted['version'],'note'=>'Sesuaikan nominal']);
    $revised=salary_set_base_rate($conn,$finance,$revision);
    $reopened=salary_mutate($conn,$finance,['action'=>'reopen','id'=>$rejected['id'],'version'=>$rejected['version']]);
    verify($reopened['total_salary']==='3800000.50','Rejected request can recalculate with revised salary');
    $submitted=salary_mutate($conn,$finance,['action'=>'submit','id'=>$reopened['id'],'version'=>$reopened['version']]);
    $approved=salary_mutate($conn,$admin,['action'=>'approve','id'=>$submitted['id'],'version'=>$submitted['version']]);
    $revision['revision']=$revised['id'];
    denied(fn()=>salary_set_base_rate($conn,$admin,$revision),409,'Approved period remains locked for Admin too');
    $paid=salary_mutate($conn,$finance,['action'=>'pay','id'=>$approved['id'],'version'=>$approved['version'],'paid_date'=>salary_today(),'transfer_reference'=>'BASE-TEST-TRANSFER']);
    denied(fn()=>salary_set_base_rate($conn,$finance,$revision),409,'Paid period cannot be revised');
    $later=salary_set_base_rate($conn,$admin,['employee_id'=>1,'effective_month'=>$next,'amount'=>'4200000.00','reason'=>'Kenaikan lanjutan','revision'=>$revised['id']]);
    verify(salary_read($conn,(int)$paid['id'])['total_salary']==='3800000.50' && $preview($next)[1]['base_salary']==='4200000.00','Future increase preserves paid snapshot');
    $history=array_column(salary_base_settings($conn,$month)['employees'],null,'employee_id')[1]['history'];
    verify(count($history)===4 && $history[0]['actor_name']==='Admin Uji' && $history[2]['actor_role']==='admin','Every change retains reason, actor and prior schedule');
    verify($conn->query('SELECT base_salary FROM employees WHERE id=1')->fetch_row()[0]==='3000000.25','Salary master does not overwrite original employee profile');
    $conn->query("INSERT INTO payslips(employee_id,month,status) VALUES(2,'$month','published')");
    denied(fn()=>salary_set_base_rate($conn,$finance,['employee_id'=>2,'effective_month'=>$month,'amount'=>'5000000','reason'=>'Legacy lock','revision'=>0]),409,'Legacy published period protected');
    $conn->query("CREATE TRIGGER fail_base_setting BEFORE INSERT ON salary_base_rates FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Base rollback test'");
    try { salary_set_base_rate($conn,$finance,['employee_id'=>3,'effective_month'=>$next,'amount'=>'2800000','reason'=>'Rollback test','revision'=>0]); throw new RuntimeException('Expected failure'); }
    catch (mysqli_sql_exception $error) { verify($error->getMessage()==='Base rollback test','Injected master save failure'); }
    verify(count(array_column(salary_base_settings($conn,$next)['employees'],null,'employee_id')[3]['history'])===0,'Failed save leaves no partial rate history');
    echo "PASS: $checks base salary settings checks.\n";
} finally { $conn->select_db($original); $conn->query("DROP DATABASE `$testName`"); }
