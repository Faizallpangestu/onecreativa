<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/salary_slip.php';
require_once __DIR__.'/salary_test_fixture.php';
mysqli_report(MYSQLI_REPORT_ERROR|MYSQLI_REPORT_STRICT);
$testName='one_creativa_salary_test_'.bin2hex(random_bytes(6));
$original=$conn->query('SELECT DATABASE()')->fetch_row()[0];
if (!preg_match('/^one_creativa_salary_test_[a-f0-9]{12}$/D',$testName) || $testName===$original) throw new RuntimeException('Invalid isolated database');
$conn->query("CREATE DATABASE `$testName`"); $conn->select_db($testName); $checks=0;
function verify(bool $condition,string $label):void { global $checks; if (!$condition) throw new RuntimeException('FAILED: '.$label); $checks++; }
function denied(callable $call,int $code,string $label):void { try {$call();} catch (SalaryWorkflowException $error) { verify($error->getCode()===$code,$label); return; } throw new RuntimeException('FAILED: '.$label.' was allowed'); }
try {
    $month=(new DateTimeImmutable('first day of last month',new DateTimeZone('Asia/Jakarta')))->format('Y-m'); install_salary_test_fixture($conn,$month);
    $finance=['id'=>1,'role'=>'finance','name'=>'Finance Uji']; $admin=['id'=>2,'role'=>'admin','name'=>'Admin Uji']; $employee=['id'=>4,'role'=>'karyawan','name'=>'Karyawan Uji']; $other=['id'=>5,'role'=>'karyawan','name'=>'Other'];
    $draft=salary_mutate($conn,$finance,['action'=>'prepare','employee_id'=>1,'month'=>$month]); $id=(int)$draft['id'];
    denied(fn()=>salary_slip_preview($conn,$finance,$id),409,'No slip preview before approval');
    denied(fn()=>salary_slip_preview($conn,$employee,$id),403,'Employee cannot view unreviewed slip');
    $submitted=salary_mutate($conn,$finance,['action'=>'submit','id'=>$id,'version'=>$draft['version']]);
    denied(fn()=>salary_slip_publish($conn,$finance,['id'=>$id,'version'=>$submitted['version'],'checked'=>true]),409,'Submission cannot be published before Admin approval');
    $approved=salary_mutate($conn,$admin,['action'=>'approve','id'=>$id,'version'=>$submitted['version']]);
    $preview=salary_slip_preview($conn,$finance,$id);
    verify(!$preview['published'] && $preview['snapshot']['total_salary']==='3200000.25','Finance preview uses approved salary including allowances');
    verify($preview['snapshot']['bpjs_tk_number']==='0011223344' && $preview['snapshot']['bpjs_kes_number']==='0009988776' && $preview['snapshot']['account_number']==='001234','BPJS identifiers and bank account retain leading zeros from profile');
    verify($preview['snapshot']['recipient_email']==='employee@example.test','Recipient is resolved from employee user profile');
    verify(str_contains($preview['document_html'],'Transfer belum dicatat') && str_contains($preview['document_html'],'0011223344') && str_contains($preview['document_html'],'120.000'),'Printable/email document includes correct payment status, BPJS and meal allowance');
    $input=['id'=>$id,'version'=>$preview['salary_version'],'preview_token'=>$preview['preview_token'],'checked'=>true];
    denied(fn()=>salary_slip_publish($conn,$admin,$input),403,'Admin cannot publish on behalf of Finance');
    denied(fn()=>salary_slip_publish($conn,$employee,$input),403,'Employee cannot publish own slip');
    denied(fn()=>salary_slip_publish($conn,$finance,array_merge($input,['checked'=>false])),422,'Finance must explicitly confirm document verification');
    denied(fn()=>salary_slip_publish($conn,$finance,array_merge($input,['version'=>0])),409,'Stale payroll version rejected');
    $conn->query("UPDATE employees SET bpjs_kes='0001112223' WHERE id=1");
    denied(fn()=>salary_slip_publish($conn,$finance,$input),409,'Profile changed after preview requires recheck');
    $preview=salary_slip_preview($conn,$finance,$id); $input['preview_token']=$preview['preview_token'];
    $conn->query("CREATE TRIGGER fail_slip_publication BEFORE INSERT ON salary_slip_events FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Slip rollback test'");
    try { salary_slip_publish($conn,$finance,$input); throw new RuntimeException('Expected failure'); } catch (mysqli_sql_exception $error) { verify($error->getMessage()==='Slip rollback test','Publication failure injected'); }
    verify(salary_slip_publication($conn,$id)===null && salary_read($conn,$id)['version']===$approved['version'],'Failed publication rolls back snapshot, audit and version');
    $conn->query('DROP TRIGGER fail_slip_publication');
    $published=salary_slip_publish($conn,$finance,$input);
    verify($published['published'] && $published['created_now'] && $published['publication']['email_status']==='pending','Publish creates employee-visible slip with truthful pending email');
    verify($published['snapshot']['payment_status']==='approved' && $conn->query('SELECT COUNT(*) FROM finance_records')->fetch_row()[0]==='0','Publishing before payday does not mark paid or create expense');
    verify(salary_slip_preview($conn,$employee,$id)['published'],'Owner can view their published slip before payment with approved status');
    denied(fn()=>salary_slip_preview($conn,$other,$id),403,'Other employee cannot read slip by guessing ID');
    $retry=salary_slip_publish($conn,$finance,$input);
    verify(!$retry['created_now'] && $retry['publication']['id']===$published['publication']['id'] && count($retry['publication']['events'])===1,'Duplicate publish is idempotent without duplicate audits or email send');
    $conn->query("UPDATE users SET email='updated@example.test' WHERE id=4"); $conn->query("UPDATE employees SET bpjs_kes='NEW',bank_account='CHANGED' WHERE id=1");
    $frozen=salary_slip_preview($conn,$finance,$id);
    verify($frozen['snapshot']['recipient_email']==='employee@example.test' && $frozen['snapshot']['bpjs_kes_number']==='0001112223' && $frozen['snapshot']['account_number']==='001234','Published profile snapshot remains unchanged when profile changes');
    $failed=salary_slip_deliver($conn,$finance,$id,function(){throw new RuntimeException('Simulated SMTP failure containing sensitive server details');});
    verify($failed['publication']['email_status']==='failed' && $failed['published'] && !str_contains($failed['publication']['email_error'],'sensitive'),'SMTP failure keeps dashboard slip available and returns sanitized error');
    verify((int)$failed['publication']['email_attempts']===1,'Failed email attempt counted');
    $sentMessages=[];
    $sent=salary_slip_deliver($conn,$finance,$id,function($snapshot,$html,$messageId)use(&$sentMessages){$sentMessages[]=[$snapshot,$html,$messageId];});
    verify($sent['publication']['email_status']==='sent' && (int)$sent['publication']['email_attempts']===2 && $sent['publication']['email_sent_at']!==null,'Explicit retry records successful SMTP acceptance and date');
    verify($sentMessages[0][0]['recipient_email']==='employee@example.test' && $sentMessages[0][0]['total_salary']==='3200000.25' && str_contains($sentMessages[0][1],'0001112223'),'Email uses immutable reviewed recipient, salary and BPJS document');
    salary_slip_deliver($conn,$finance,$id,function()use(&$sentMessages){$sentMessages[]='duplicate';});
    verify(count($sentMessages)===1,'Duplicate send requests do not resend successful email');
    denied(fn()=>salary_slip_deliver($conn,$admin,$id),403,'Admin cannot bypass Finance email control');
    $fresh=salary_read($conn,$id);
    $paid=salary_mutate($conn,$finance,['action'=>'pay','id'=>$id,'version'=>$fresh['version'],'paid_date'=>salary_today(),'transfer_reference'=>'SLIP-TEST-BANK']);
    $afterPay=salary_slip_preview($conn,$employee,$id);
    verify($afterPay['snapshot']['payment_status']==='paid' && $afterPay['snapshot']['paid_date']===salary_today() && str_contains($afterPay['document_html'],'SLIP-TEST-BANK'),'Published slip shows actual payment once recorded');
    verify($afterPay['snapshot']['bpjs_kes_number']==='0001112223' && $paid['total_salary']==='3200000.25','Payment refresh preserves immutable profile/amounts');
    $escaped=salary_slip_html(array_merge($afterPay['snapshot'],['employee_name'=>'<script>alert(1)</script>','bpjs_tk_number'=>'<img src=x onerror=alert(1)>']));
    verify(!str_contains($escaped,'<script>') && !str_contains($escaped,'<img src=') && str_contains($escaped,'&lt;script&gt;'),'HTML and email content escape profile values');
    $conn->query("UPDATE salary_slips SET email_status='sending' WHERE salary_request_id=$id");
    salary_slip_deliver($conn,$finance,$id,function()use(&$sentMessages){$sentMessages[]='unsafe-retry';});
    verify(count($sentMessages)===1,'In-progress/uncertain delivery cannot trigger an automatic duplicate');
    verify(!salary_mail_configured(['host'=>'','from_email'=>'finance@example.test','encryption'=>'tls','port'=>587]) && !salary_mail_configured(['host'=>'smtp.example.test','from_email'=>'finance@example.test','encryption'=>'none','port'=>25]),'Missing SMTP or unencrypted production configuration is rejected');
    $hostinger=['host'=>'smtp.hostinger.com','port'=>465,'encryption'=>'ssl','from_email'=>'finance@creativabridging.com','username'=>'finance@creativabridging.com','password'=>''];
    verify(!salary_mail_configured($hostinger),'SMTP requiring authentication stays disabled until password is filled');
    verify(salary_mail_configured(array_merge($hostinger,['password'=>'isolated-test-only'])),'Completed authenticated SMTP configuration is recognized without sending');
    verify(salary_mail_configured(array_merge($hostinger,['username'=>''])),'Anonymous trusted relay remains supported');
    echo "PASS: $checks salary slip checks.\n";
} finally { $conn->select_db($original); $conn->query("DROP DATABASE `$testName`"); }
