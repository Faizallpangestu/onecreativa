<?php
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require_once __DIR__.'/../services/learning_dashboard.php';
require_once __DIR__.'/../services/learning_attendance.php';
require_once __DIR__.'/../services/student_billing.php';
require_once __DIR__.'/../services/matching.php';
require_once __DIR__.'/../services/accounting_schema.php';
require_once __DIR__.'/../services/accounting_documents.php';
require_once __DIR__.'/../services/accounting_journal.php';
date_default_timezone_set('Asia/Jakarta');
$source=file_get_contents(__DIR__.'/../config/'.(is_file(__DIR__.'/../config/db_env.php')?'db_env.php':'database.php'));$values=[];foreach(['DB_HOST','DB_USER','DB_PASS','DB_NAME']as $key){if(!preg_match('/\$'.$key.'\s*=\s*([\x27\x22])([^\x27\x22]*)\1\s*;/',$source,$match))throw new RuntimeException('Unsupported local config');$values[$key]=$match[2];}
if(!in_array($values['DB_HOST'],['localhost','127.0.0.1','::1'],true))throw new RuntimeException('Local tests only');mysqli_report(MYSQLI_REPORT_ERROR|MYSQLI_REPORT_STRICT);
$db=new mysqli($values['DB_HOST'],$values['DB_USER'],$values['DB_PASS'],$values['DB_NAME']);$db->set_charset('utf8mb4');$original=$values['DB_NAME'];$name='one_creativa_release_test_'.bin2hex(random_bytes(8));if($name===$original||!preg_match('/^one_creativa_release_test_[a-f0-9]{16}$/D',$name))throw new RuntimeException('Unsafe test database');
$schemas=[];foreach(ac_rows($db,"SHOW FULL TABLES WHERE Table_type='BASE TABLE'")as $r){$table=array_values($r)[0];$schemas[]=ac_one($db,'SHOW CREATE TABLE `'.$table.'`')['Create Table'];}
$db->query('CREATE DATABASE `'.$name.'` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci');$db->select_db($name);$checks=0;
function release_check(bool $ok,string $label):void{global $checks;if(!$ok)throw new RuntimeException('FAILED: '.$label);$checks++;}
function release_reject(callable $call,int $code,string $label):void{try{$call();}catch(AccountingException $e){release_check($e->getCode()===$code,$label);return;}throw new RuntimeException('NOT REJECTED: '.$label);}
try{
 $db->query('SET FOREIGN_KEY_CHECKS=0');foreach($schemas as $sql)$db->query($sql);$db->query('SET FOREIGN_KEY_CHECKS=1');
 foreach([[1,'super_admin'],[2,'sensei'],[3,'peserta_intensif'],[4,'finance'],[5,'hr'],[6,'lpk'],[7,'admin']]as [$id,$role])ac_query($db,'INSERT INTO roles(id,name,label) VALUES(?,?,?)',[$id,$role,$role]);
 foreach([[1,1],[2,2],[3,2],[4,3],[5,3],[6,4],[7,5],[8,6],[9,7]]as [$id,$role])ac_query($db,'INSERT INTO users(id,email,password_hash,role_id,is_active) VALUES(?,?,?,?,1)',[$id,'user'.$id.'@example.test',password_hash('release-test-only',PASSWORD_DEFAULT),$role]);
 ac_query($db,'INSERT INTO peserta_intensif(id,user_id,nama_lengkap,no_wa,email,level,batch) VALUES(1,4,?,?,?,?,?),(2,5,?,?,?,?,?)',['Siswa A','0811111111','a@example.test','N5','Batch A','Siswa B','0822222222','b@example.test','N4','Batch B']);
 $admin=['id'=>1,'role'=>'super_admin','name'=>'Administrator'];$teacher=['id'=>2,'role'=>'sensei','name'=>'Sensei A'];$other=['id'=>3,'role'=>'sensei','name'=>'Sensei B'];$student=['id'=>4,'role'=>'peserta_intensif','name'=>'Siswa A'];$foreign=['id'=>5,'role'=>'peserta_intensif','name'=>'Siswa B'];$today=date('Y-m-d');
 release_check(count(rs_roster($db,$teacher))===0,'No assignments means no global roster');
 $c=rs_admin_mutate($db,$admin,['action'=>'class','code'=>'TEST-A','name'=>'Kelas A','program_code'=>'Japanese','batch'=>'Batch A','level'=>'N5','status'=>'active']);$class=$c['id'];
 release_reject(fn()=>rs_admin_mutate($db,$teacher,['action'=>'class','code'=>'BAD','name'=>'Unauthorized']),403,'Teacher cannot create class relationship');
 $assignment=rs_admin_mutate($db,$admin,['action'=>'assignment','class_id'=>$class,'sensei_user_id'=>2,'starts_on'=>'2026-01-01','ends_on'=>'2030-12-31'])['id'];
 release_reject(fn()=>rs_admin_mutate($db,$admin,['action'=>'assignment','class_id'=>$class,'sensei_user_id'=>6,'starts_on'=>$today]),422,'Finance cannot be assigned as Sensei');
 release_reject(fn()=>rs_admin_mutate($db,$admin,['action'=>'assignment','class_id'=>$class,'sensei_user_id'=>2,'starts_on'=>$today]),409,'Overlapping duplicate assignment rejected');
 rs_admin_mutate($db,$admin,['action'=>'enrollment','class_id'=>$class,'student_id'=>1,'joined_on'=>'2026-01-01']);
 release_check(count(rs_roster($db,$teacher))===1&&count(rs_roster($db,$other))===0,'Teachers only get assigned enrolled roster');
 release_check(count(rs_roster($db,$student))===1&&count(rs_roster($db,$foreign))===0,'Student roster is personal');
 ac_query($db,'INSERT INTO lms_meetings(id,title,meeting_date,start_time,end_time,sensei_id,type) VALUES(1,?,?,?,?,?,?)',['Kelas hari ini',$today,'00:01:00','23:59:00',2,'Masuk']);ac_query($db,'INSERT INTO lms_meeting_assignments(meeting_id,assignment_id,linked_by) VALUES(1,?,1)',[$assignment]);
 release_check((int)rs_meeting($db,$teacher,1,true)['class_id']===$class,'Teacher meeting ownership uses assignment');
 release_reject(fn()=>rs_meeting($db,$other,1,true),403,'Unassigned teacher read/write denied');release_reject(fn()=>rs_meeting($db,$foreign,1),403,'Unenrolled student meeting denied');
 ac_query($db,'INSERT INTO lms_tasks(id,meeting_id,title,category,due_date) VALUES(1,1,?,?,?)',['Tugas A','tugas','2030-12-31 23:59:00']);
 $submission=ls_submit($db,$student,['task_id'=>1,'submission_text'=>'Jawaban uji']);$id=$submission['id'];
 release_check(ls_submit($db,$student,['task_id'=>1,'submission_text'=>'Jawaban uji'])['id']===$id&&count(ac_rows($db,'SELECT id FROM lms_submissions'))===1,'Submission retry has no duplicate');
 release_reject(fn()=>ls_submit($db,$foreign,['task_id'=>1,'submission_text'=>'Spoof']),403,'Foreign class submission denied');
 release_reject(fn()=>ls_grade($db,$student,['submission_id'=>$id,'grade'=>100]),403,'Learner cannot grade');release_reject(fn()=>ls_grade($db,$other,['submission_id'=>$id,'grade'=>100]),403,'Other teacher cannot grade');
 release_reject(fn()=>ls_grade($db,$teacher,['action'=>'publish','submission_id'=>$id]),409,'Incomplete grade cannot publish');
 ls_grade($db,$teacher,['submission_id'=>$id,'grade'=>0,'feedback'=>'Uji nol']);$before=ac_one($db,'SELECT submitted_at FROM lms_submissions WHERE id=?',[$id])['submitted_at'];
 release_check(ls_submissions($db,$student)[0]['grade']===null,'Draft grade hidden from learner');release_check(ls_submissions($db,$teacher)[0]['grade']==='0','Teacher sees draft zero grade');
 ls_grade($db,$teacher,['action'=>'publish','submission_id'=>$id]);release_check(ls_submissions($db,$student)[0]['grade']==='0','Published zero grade visible');
 release_check(ls_dashboard($db,$student)['rata_rata_nilai']===0.0,'Real zero participates in grade average');release_check(ac_one($db,'SELECT submitted_at FROM lms_submissions WHERE id=?',[$id])['submitted_at']===$before,'Grading preserves original submitted timestamp');
 release_reject(fn()=>ls_grade($db,$teacher,['submission_id'=>$id,'grade'=>99]),409,'Published grade cannot silently change');
 $session=la_issue($db,$teacher,1);release_check(strlen($session['token'])===64,'Server issues strong attendance token');release_reject(fn()=>la_issue($db,$student,1),403,'Student cannot issue token');release_reject(fn()=>la_save($db,$student,['meeting_id'=>1,'token'=>str_repeat('0',64)]),403,'Fabricated QR rejected');
 $saved=la_save($db,$student,['meeting_id'=>1,'token'=>$session['token'],'siswa_id'=>5]);release_check((int)$saved['siswa_id']===4,'QR attendance ignores client identity spoof');$repeated=la_save($db,$student,['meeting_id'=>1,'token'=>$session['token']]);release_check($saved['check_in']===$repeated['check_in']&&count(ac_rows($db,'SELECT id FROM lms_attendance'))===1,'Attendance retry preserves timestamp and count');
 release_reject(fn()=>la_save($db,$foreign,['meeting_id'=>1,'token'=>$session['token']]),403,'Attendance requires enrolled class');$new=la_issue($db,$teacher,1);release_reject(fn()=>la_save($db,$student,['meeting_id'=>1,'token'=>$session['token']]),403,'Rotated token revoked');la_save($db,$student,['meeting_id'=>1,'action'=>'check_out','token'=>$new['token']]);
 $dash=ls_dashboard($db,$teacher);release_check($dash['total_siswa']===1&&$dash['hadir_hari_ini']+$dash['terlambat_hari_ini']===1,'Teacher attendance dashboard matches learner');release_check(ls_dashboard($db,$other)['total_siswa']===0,'Unassigned dashboard has real zero');
 ac_query($db,"UPDATE lms_tasks SET due_date='2020-01-01 00:00:00' WHERE id=1");release_reject(fn()=>ls_submit($db,$student,['task_id'=>1,'submission_text'=>'Late']),409,'Deadline enforced server side');
 ac_query($db,'UPDATE lms_attendance_sessions SET issued_at=DATE_SUB(NOW(),INTERVAL 1 DAY),expires_at=DATE_SUB(NOW(),INTERVAL 1 SECOND)');release_reject(fn()=>la_save($db,$student,['meeting_id'=>1,'token'=>$new['token']]),403,'Expired token denied');
 release_check(count(ac_rows($db,'SELECT id FROM accounting_audit_logs'))>=7,'Relationships and learning mutations have atomic actor audit');
 // Billing uses the same posting/allocation engine as Finance; receipts alone never reduce AR.
 install_accounting_schema($db);$finance=['id'=>6,'role'=>'finance','name'=>'Finance'];ac_master_mutate($db,$admin,['action'=>'period','month'=>substr($today,0,7),'status'=>'open','reason'=>'Periode pengujian sintetis']);
 ac_query($db,"INSERT INTO billing_invoices(id,tanggal,customer,total,jatuhTempo) VALUES('INV-RELEASE',?,'Siswa A','1000.25',?)",[$today,$today]);
 $link=sb_link($db,$finance,['student_id'=>1,'billing_invoice_id'=>'INV-RELEASE']);release_check(sb_link($db,$finance,['student_id'=>1,'billing_invoice_id'=>'INV-RELEASE'])['id']===$link['id'],'Invoice link retry is idempotent');
 release_reject(fn()=>sb_link($db,$finance,['student_id'=>2,'billing_invoice_id'=>'INV-RELEASE']),409,'Invoice ownership cannot silently change');release_reject(fn()=>sb_link($db,$student,['student_id'=>1,'billing_invoice_id'=>'INV-RELEASE']),403,'Learner cannot link Finance invoices');
 $ownerLink=ac_one($db,'SELECT * FROM student_invoice_links WHERE id=?',[$link['id']]);release_check(sb_bill($db,$ownerLink)['outstanding']==='1000.25','Unrecognized invoice displays actual outstanding');
 $accounts=[];foreach(ac_rows($db,'SELECT id,code FROM accounts')as $r)$accounts[$r['code']]=(int)$r['id'];ac_master_mutate($db,$admin,['action'=>'bank','name'=>'Bank Uji','account_id'=>$accounts['1100']]);$bank=(int)ac_one($db,'SELECT id FROM cash_bank_accounts')['id'];
 ac_recognize($db,$finance,['request_key'=>bin2hex(random_bytes(16)),'source_type'=>'billing_invoice','source_id'=>'INV-RELEASE','control_account_id'=>$accounts['1200'],'recognition_account_id'=>$accounts['2400'],'date'=>$today,'student_id'=>1]);
 ac_query($db,'INSERT INTO student_payment_submissions(invoice_link_id,student_id,amount,transfer_date,reference,proof_file,request_key) VALUES(?,1,?,?,?,?,?)',[$link['id'],'100.01',$today,'TRANSFER-TEST','synthetic-test-proof.pdf',bin2hex(random_bytes(16))]);$receipt=$db->insert_id;
 release_check(sb_bill($db,$ownerLink)['paid']==='0.00','Pending student receipt does not imply payment');release_reject(fn()=>sb_review($db,$finance,['id'=>$receipt,'status'=>'accepted','transaction_id'=>123456]),409,'Receipt cannot be accepted without posted payment');
 $tx=ac_transaction_create($db,$finance,['request_key'=>bin2hex(random_bytes(16)),'classification'=>'invoice_payment','source_type'=>'billing_invoice','source_id'=>'INV-RELEASE','amount'=>'100.01','cash_account_id'=>$bank,'counter_account_id'=>$accounts['1200'],'transaction_date'=>$today,'party_name'=>'Siswa A','description'=>'Pembayaran uji','attachment_link'=>'https://example.test/synthetic-proof','reference'=>'TRANSFER-TEST']);
 foreach(['submit','approve','pay','verify','post']as $event)ac_transaction_action($db,$event==='approve'?$admin:$finance,['action'=>$event,'id'=>$tx['id'],'request_key'=>bin2hex(random_bytes(16))]);
 $bill=sb_bill($db,$ownerLink);release_check($bill['paid']==='100.01'&&$bill['outstanding']==='900.24'&&count($bill['payments'])===1,'Verified posted partial payment reconciles student outstanding exactly');
 sb_review($db,$finance,['id'=>$receipt,'status'=>'accepted','transaction_id'=>$tx['id']]);release_reject(fn()=>sb_review($db,$finance,['id'=>$receipt,'status'=>'rejected','review_notes'=>'overwrite']),409,'Receipt reviewer cannot overwrite decision');
 $journal=(int)ac_one($db,'SELECT journal_entry_id FROM accounting_transactions WHERE id=?',[$tx['id']])['journal_entry_id'];ac_atomic($db,fn()=>ac_reverse($db,$finance,$journal,$today,'Pembatalan pembayaran sintetis'));release_check(sb_bill($db,$ownerLink)['outstanding']==='1000.25','Reversed payment restores student outstanding');
 $external=mk_mutate($db,$admin,['nama_lengkap'=>'Kandidat eksternal','email'=>'external@example.test','no_wa'=>'0833333333','lpk_pengirim'=>'LPK Eksternal']);release_check(!ac_one($db,'SELECT candidate_id FROM matching_student_links WHERE candidate_id=?',[$external['id']]),'External candidate needs no invented student');
 release_reject(fn()=>mk_mutate($db,$admin,['nama_lengkap'=>'Duplikat','email'=>'EXTERNAL@example.test','no_wa'=>'']),409,'Candidate duplicate identity rejected');
 $candidate=mk_mutate($db,$admin,['student_id'=>1,'lpk_pengirim'=>'Internal']);release_check((int)ac_one($db,'SELECT student_id FROM matching_student_links WHERE candidate_id=?',[$candidate['id']])['student_id']===1,'Candidate reuses exact selected student identity');
 release_reject(fn()=>mk_mutate($db,$admin,['student_id'=>1]),409,'Same student cannot generate second candidate');release_reject(fn()=>mk_access($db,['id'=>8,'role'=>'lpk','name'=>'LPK'],$candidate['id']),403,'LPK cannot read another owner candidate');
 release_reject(fn()=>mk_mutate($db,$admin,['id'=>$candidate['id'],'action'=>'update_progress','progress'=>'Siap Terbang','notes'=>'Uji kesiapan']),409,'Ready departure requires verified documents');
 mk_mutate($db,$admin,['id'=>$candidate['id'],'action'=>'update_progress','progress'=>'Screening Berkas','notes'=>'Hasil review uji']);release_check((int)ac_one($db,"SELECT COUNT(*) AS n FROM matching_candidate_history WHERE candidate_id=? AND action='progress'",[$candidate['id']])['n']===1,'Candidate progress has actor history');
 release_check((int)ac_one($db,"SELECT COUNT(*) AS n FROM (SELECT j.id FROM journal_entries j JOIN journal_lines l ON l.journal_entry_id=j.id WHERE j.status='posted' GROUP BY j.id HAVING SUM(l.debit)<>SUM(l.credit)) x")['n']===0,'Student integration preserves balanced journals');
 echo "PASS: $checks relationship/learning/QR checks in isolated synthetic database.\n";
}finally{$db->select_db($original);if(!preg_match('/^one_creativa_release_test_[a-f0-9]{16}$/D',$name)||$name===$original)throw new RuntimeException('Unsafe cleanup');$db->query('DROP DATABASE `'.$name.'`');$db->close();}
