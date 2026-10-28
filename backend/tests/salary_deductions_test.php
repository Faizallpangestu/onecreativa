<?php
if (PHP_SAPI!=='cli') { http_response_code(404); exit; }
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/salary_slip.php';
require_once __DIR__.'/salary_test_fixture.php';
mysqli_report(MYSQLI_REPORT_ERROR|MYSQLI_REPORT_STRICT);
$testName='one_creativa_salary_test_'.bin2hex(random_bytes(6));
$original=$conn->query('SELECT DATABASE()')->fetch_row()[0];
if (!preg_match('/^one_creativa_salary_test_[a-f0-9]{12}$/D',$testName) || $testName===$original) throw new RuntimeException('Invalid isolated database');
$conn->query("CREATE DATABASE `$testName`"); $conn->select_db($testName); $checks=0;
function verify(bool $condition,string $label): void { global $checks; if (!$condition) throw new RuntimeException('FAILED: '.$label); $checks++; }
function denied(callable $call,int $code,string $label): void { try { $call(); } catch (SalaryWorkflowException $error) { verify($error->getCode()===$code,$label); return; } throw new RuntimeException('FAILED: '.$label.' was allowed'); }
try {
    $month=(new DateTimeImmutable('first day of last month',new DateTimeZone('Asia/Jakarta')))->format('Y-m'); install_salary_test_fixture($conn,$month);
    $finance=['id'=>1,'role'=>'finance','name'=>'Finance Uji']; $admin=['id'=>2,'role'=>'admin','name'=>'Admin Uji']; $employee=['id'=>4,'role'=>'karyawan','name'=>'Karyawan Uji'];
    $draft=salary_mutate($conn,$finance,['action'=>'prepare','employee_id'=>1,'month'=>$month]); $id=(int)$draft['id'];
    verify($draft['gross_salary']==='3200000.25' && $draft['total_deductions']==='0.00' && $draft['total_salary']==='3200000.25','Zero manual deductions preserve existing calculations');
    verify($draft['employee_join_date']==='2000-01-01','Employment start date captured for slip');
    $manual=['thr_amount'=>'250000.25','kasbon_deduction'=>'100000','bpjs_tk_deduction'=>'60000','bpjs_kes_deduction'=>'30000.10','leave_deduction'=>'50000','adjustment_note'=>'BPJS periode ini; izin 1 hari'];
    $input=['action'=>'refresh','id'=>$id,'version'=>$draft['version']]+$manual;
    foreach (['-1','1,00','0.001','1e4',[],true,null] as $value) {
        $bad=array_merge($input,['bpjs_tk_deduction'=>$value]);
        denied(fn()=>salary_mutate($conn,$finance,$bad),422,'Invalid manual deduction rejected');
    }
    denied(fn()=>salary_mutate($conn,$finance,array_merge($input,['kasbon_deduction'=>'9999999999999.99'])),422,'Deduction exceeding income rejected');
    denied(fn()=>salary_mutate($conn,$finance,array_merge($input,['thr_amount'=>'9999999999999.99'])),422,'Gross salary overflow rejected');
    denied(fn()=>salary_mutate($conn,$admin,$input),403,'Admin cannot enter Finance manual adjustments');
    verify(salary_read($conn,$id)['version']===$draft['version'],'Failed adjustments leave draft/version untouched');
    $saved=salary_mutate($conn,$finance,$input);
    verify($saved['gross_salary']==='3450000.50' && $saved['total_deductions']==='240000.10' && $saved['total_salary']==='3210000.40','Exact cents: base and allowances plus THR minus four manual deductions');
    verify($saved['bpjs_tk_deduction']==='60000.00' && $saved['adjustment_note']===$manual['adjustment_note'],'Manual BPJS values and Finance reason stored');
    $event=json_decode($saved['history'][0]['snapshot_json'],true);
    verify($event['leave_deduction']==='50000.00' && $event['total_salary']==='3210000.40','Audit contains complete submitted financial components');
    denied(fn()=>salary_mutate($conn,$finance,$input),409,'Stale adjustment version rejected');
    $conn->query("INSERT INTO attendance_logs(employee_id,date,status) VALUES(1,'$month-08','dinas')");
    denied(fn()=>salary_mutate($conn,$finance,['action'=>'submit','id'=>$id,'version'=>$saved['version']]),409,'Manual adjustments do not bypass stale attendance checks');
    $saved=salary_mutate($conn,$finance,['action'=>'refresh','id'=>$id,'version'=>$saved['version']]);
    verify($saved['total_salary']==='3260000.40' && $saved['total_deductions']==='240000.10' && $saved['thr_amount']==='250000.25','Attendance refresh preserves manual values and updates net salary');
    $submitted=salary_mutate($conn,$finance,['action'=>'submit','id'=>$id,'version'=>$saved['version']]);
    denied(fn()=>salary_mutate($conn,$finance,['action'=>'refresh','id'=>$id,'version'=>$submitted['version'],'leave_deduction'=>'0']),409,'Submitted manual amounts locked');
    $rejected=salary_mutate($conn,$admin,['action'=>'reject','id'=>$id,'version'=>$submitted['version'],'note'=>'Revisi potongan izin']);
    $reopened=salary_mutate($conn,$finance,['action'=>'reopen','id'=>$id,'version'=>$rejected['version']]);
    verify($reopened['leave_deduction']==='50000.00','Rejected draft retains original adjustments until Finance revises');
    $revised=salary_mutate($conn,$finance,['action'=>'refresh','id'=>$id,'version'=>$reopened['version'],'leave_deduction'=>'40000']);
    verify($revised['total_salary']==='3270000.40' && $revised['total_deductions']==='230000.10','Revised deduction requires fresh submission and approval');
    $submitted=salary_mutate($conn,$finance,['action'=>'submit','id'=>$id,'version'=>$revised['version']]);
    $approved=salary_mutate($conn,$admin,['action'=>'approve','id'=>$id,'version'=>$submitted['version'],'total_salary'=>'1','bpjs_tk_deduction'=>'1']);
    verify($approved['total_salary']==='3270000.40' && $approved['bpjs_tk_deduction']==='60000.00','Approval uses saved Finance amounts and ignores client tampering');
    denied(fn()=>salary_mutate($conn,$finance,['action'=>'refresh','id'=>$id,'version'=>$approved['version'],'bpjs_tk_deduction'=>'0']),409,'Approved deductions cannot be edited');
    $preview=salary_slip_preview($conn,$finance,$id);
    verify($preview['snapshot']['bpjs_tk_number']==='0011223344' && $preview['snapshot']['bpjs_tk_deduction']==='60000.00','BPJS membership ID is distinct from manual currency deduction');
    verify(str_contains($preview['document_html'],'JUMLAH PENDAPATAN') && str_contains($preview['document_html'],'JUMLAH POTONGAN') && str_contains($preview['document_html'],'GAJI BERSIH') && str_contains($preview['document_html'],'3.270.000,40'),'Slip renders income, deductions and exact net amount');
    verify(str_contains($preview['document_html'],'01 JANUARI 2000') && str_contains($preview['document_html'],'data:image/png;base64,'),'Slip uses employment date and embedded logo');
    $published=salary_slip_publish($conn,$finance,['id'=>$id,'version'=>$approved['version'],'checked'=>true,'preview_token'=>$preview['preview_token']]);
    verify(salary_slip_preview($conn,$employee,$id)['snapshot']['total_deductions']==='230000.10','Employee sees approved deductions only after Finance publication');
    $sent=[]; salary_slip_deliver($conn,$finance,$id,function($snapshot,$html)use(&$sent){$sent=[$snapshot,$html];});
    verify($sent[0]['total_salary']==='3270000.40' && str_contains($sent[1],'230.000,10'),'Email uses identical approved net salary and deduction total');
    $request=salary_read($conn,$id);
    $paid=salary_mutate($conn,$finance,['action'=>'pay','id'=>$id,'version'=>$request['version'],'paid_date'=>salary_today(),'transfer_reference'=>'NET-SALARY-TEST','total_salary'=>'1']);
    $expense=$conn->query('SELECT amount FROM finance_records WHERE salary_request_id='.$id)->fetch_assoc();
    verify($paid['total_salary']==='3270000.40' && $expense['amount']==='3270000.40','Recorded transfer expense equals approved net salary');
    verify(salary_slip_preview($conn,$employee,$id)['snapshot']['bpjs_tk_deduction']==='60000.00','Paid slip retains approved manual deductions');
    foreach (['5700000'=>'Lima Juta Tujuh Ratus Ribu Rupiah','0'=>'Nol Rupiah','100'=>'Seratus Rupiah','1000'=>'Seribu Rupiah','1000000000'=>'Satu Miliar Rupiah','3270000.40'=>'Tiga Juta Dua Ratus Tujuh Puluh Ribu Rupiah Empat Puluh Sen'] as $amount=>$words) verify(salary_slip_in_words((string)$amount)===$words,'Indonesian amount in words is exact');
    echo "PASS: $checks manual salary deduction and slip checks.\n";
} finally { $conn->select_db($original); $conn->query("DROP DATABASE `$testName`"); }
