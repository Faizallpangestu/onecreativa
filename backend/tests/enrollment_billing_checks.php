<?php
function enrollment_billing_checks(mysqli $db, string $testName, string $pricingFile, string $registrationFile, array $base, callable $send, string $cookie, string $csrf): void {
    require_once __DIR__.'/../services/registration_sync.php';
    $start=$GLOBALS['checks']; $catalog=pricing_fixture_catalog();
    $configure=fn(array $value)=>file_put_contents($pricingFile,eb_json($value));
    $webhook=fn(array $student)=>$send('webhook_registration.php',['secret'=>$testName,'student'=>$student,'defer_delivery_log'=>true]);
    $post=fn(array $body)=>$send('billing.php',$body,$cookie,$csrf);
    $person=['external_student_id'=>'multi-person','external_enrollment_id'=>'multi-first','nama'=>'Multi Student','email'=>'multi@test.invalid','program'=>'Intensif','skema'=>'full','total_biaya'=>'15000000.50','batch'=>'2026-A'];
    $concurrent=function(array $requests)use($testName):array{
        $prefix=sys_get_temp_dir().'/'.$testName.'_workers_'.bin2hex(random_bytes(4)); $barrier=$prefix.'_start'; $processes=[]; $files=[];
        try {
            foreach($requests as $index=>$request){
                $file=$prefix.'_'.$index.'.json';file_put_contents($file,eb_json($request));$files[]=$file;
                $process=proc_open([PHP_BINARY,__DIR__.'/enrollment_billing_worker.php',$testName,$file,$barrier],[['pipe','r'],['pipe','w'],['pipe','w']],$pipes,dirname(__DIR__,2));
                if(!is_resource($process))throw new RuntimeException('Cannot start concurrency worker');
                fclose($pipes[0]);$processes[]=[$process,$pipes];
            }
            file_put_contents($barrier,'start');$results=[];
            foreach($processes as [$process,$pipes]){$raw=stream_get_contents($pipes[1]);$error=stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);$exit=proc_close($process);$results[]=json_decode($raw,true)??['code'=>500,'error'=>$error,'exit'=>$exit];}
            $processes=[];return $results;
        } finally { foreach($processes as [$process]){if(is_resource($process)){proc_terminate($process);proc_close($process);}}foreach([...$files,$barrier]as $file)if(is_file($file))unlink($file); }
    };
    try {
        $first=$webhook($person);billing_check($first['code']===200&&$first['json']['summary']['invoices_created']===1,'One person, one explicit enrollment, one initial invoice');$first=$first['json']['data'][0];
        $opaqueReplay=$webhook(array_replace($person,['id'=>'legacy-opaque-uuid']));billing_check($opaqueReplay['code']===200&&$opaqueReplay['json']['data'][0]['invoice_id']===$first['invoice_id'],'Opaque legacy id is only an observation and never overrides explicit person/enrollment identity');
        $firstSnapshot=ac_one($db,'SELECT * FROM student_enrollments WHERE id=?',[$first['enrollment_id']]);
        $legacyFee=ac_one($db,'SELECT total_biaya,program,metode_pembayaran FROM peserta_intensif WHERE id=?',[$first['student_id']]);
        $different=$catalog;$kaigo=$different['rules'][0];$kaigo['id']='synthetic-kaigo';$kaigo['program']='kaigo_dana_talang';
        $kaigo['amount']=$kaigo['installments'][0]['amount']=$kaigo['charges'][0]['amount']=$kaigo['charges'][0]['installments'][0]['amount']='1777.77';$different['rules'][]=$kaigo;$configure($different);
        $second=$webhook(array_replace($person,['external_enrollment_id'=>'multi-second','program'=>'Kaigo','total_biaya'=>'1777.77','batch'=>'2027-B']));
        billing_check($second['code']===200&&$second['json']['summary']['students_created']===0&&$second['json']['summary']['invoices_created']===1,'Same student can enroll in another program/cohort and receive a distinct invoice');$second=$second['json']['data'][0];
        billing_check((int)$second['student_id']===(int)$first['student_id']&&$second['enrollment_id']!==$first['enrollment_id']&&$second['invoice_id']!==$first['invoice_id']&&$second['nominal']==='1777.77','Second enrollment uses its own approved price, not first student fee');
        billing_check(ac_one($db,'SELECT * FROM student_enrollments WHERE id=?',[$first['enrollment_id']])===$firstSnapshot&&ac_one($db,'SELECT total_biaya,program,metode_pembayaran FROM peserta_intensif WHERE id=?',[$first['student_id']])===$legacyFee,'Later enrollment preserves first snapshot and operational student pricing');
        billing_check(ac_one($db,'SELECT batch FROM peserta_intensif WHERE id=?',[$first['student_id']])['batch']==='2026-A','New cohort is scoped to its enrollment, not a destructive student-global batch overwrite');
        $third=$webhook(array_replace($person,['external_enrollment_id'=>'multi-third','batch'=>'2027-C']));
        billing_check($third['code']===200&&$third['json']['data'][0]['student_id']===$first['student_id']&&$third['json']['data'][0]['enrollment_id']!==$first['enrollment_id'],'Same program in a new cohort is a distinct enrollment only with a distinct verified occurrence ID');
        $configure($catalog);
        $fee=ac_one($db,"SELECT * FROM enrollment_charges WHERE enrollment_id=? AND charge_type='registration_fee'",[$first['enrollment_id']]);
        $body=['action'=>'add_invoice','student_id'=>(int)$first['student_id'],'enrollment_id'=>(int)$first['enrollment_id'],'charge_id'=>(int)$fee['id'],'bank_account_id'=>1,'tanggal'=>'2026-11-13','jatuhTempo'=>'2026-11-20','total'=>'100.25'];
        $extra=$post($body);billing_check($extra['code']===200&&$extra['json']['data']['id']!==$first['invoice_id'],'One enrollment supports separate invoices for two independently approved charge types');
        billing_check($post($body)['json']['data']['id']===$extra['json']['data']['id'],'Same charge type and occurrence replay remains idempotent');
        $occurrences=$catalog;
        foreach (['approved-event-a','approved-event-b'] as $key) {
            $policy=$occurrences['rules'][0]['charges'][1];$policy['type']='additional_fee';$policy['key']=$key;$policy['label']='Synthetic approved occurrence';$occurrences['rules'][0]['charges'][]=$policy;
        }
        $configure($occurrences);$occurrencePayload=enrollment_test_payload($db);$configure($catalog);
        $occurrenceIds=[];
        foreach(ac_rows($db,"SELECT * FROM enrollment_charges WHERE enrollment_id=? AND charge_type='additional_fee' ORDER BY id",[$occurrencePayload['enrollment_id']]) as $approvedCharge) {
            $res=$post(array_replace($occurrencePayload,['charge_id'=>(int)$approvedCharge['id'],'total'=>$approvedCharge['amount']]));
            billing_check($res['code']===200,'Distinct occurrence key requires and uses its explicit approved charge authorization');$occurrenceIds[]=$res['json']['data']['id'];
        }
        billing_check(count(array_unique($occurrenceIds))===2,'Two verified occurrences of the same approved type may produce separate invoices');
        ac_query($db,"UPDATE billing_invoices SET status='Cancelled' WHERE id=?",[$extra['json']['data']['id']]);
        $replay=$post($body);billing_check($replay['code']===200&&$replay['json']['data']['id']===$extra['json']['data']['id']&&$replay['json']['data']['status']==='Cancelled'&&!$replay['json']['data']['created_now'],'Cancelled charge is consumed; retry never invents a replacement key/invoice');
        $view=$send('billing.php?view=charge&student_id='.$body['student_id'].'&enrollment_id='.$body['enrollment_id'].'&charge_id='.$body['charge_id'],null,$cookie);
        billing_check($view['code']===200&&$view['json']['data']['invoice']['id']===$extra['json']['data']['id'],'Network reconciliation resolves the stable charge independently of invoice number');
        billing_check($send('billing.php?view=charge&student_id=2&enrollment_id='.$body['enrollment_id'].'&charge_id='.$body['charge_id'],null,$cookie)['code']===409,'Reconciliation validates enrollment/student ownership');
        $lookups=eb_lookups($db);billing_check(count(array_filter($lookups['enrollments'],fn($row)=>(int)$row['student_id']===(int)$first['student_id']))===3&&count(array_filter($lookups['charges'],fn($row)=>(int)$row['enrollment_id']===(int)$first['enrollment_id']))===2,'Finance lookups expose every enrollment and only approved charge snapshots');
        $httpLookups=$send('accounting.php?view=lookups',null,$cookie);
        billing_check($httpLookups['code']===200&&$httpLookups['json']['data']['enrollment_schema_ready']===true&&count($httpLookups['json']['data']['enrollments'])===count($lookups['enrollments']),'Real accounting lookup API exposes enrollment and charge IDs');
        $before=(int)ac_one($db,'SELECT COUNT(*) AS n FROM billing_invoices')['n'];
        foreach([
            ['id'=>101,'nama'=>'Legacy web only'],
            ['external_student_id'=>'identity-only','id'=>102,'nama'=>'Identity only'],
            ['noKtp'=>'SYNTHETIC-NIK-ONLY','id'=>103,'nama'=>'NIK only'],
        ]as $ambiguous){$res=$webhook($ambiguous);billing_check($res['code']===200&&$res['json']['data'][0]['pricing_status']==='needs_review'&&$res['json']['data'][0]['invoice_id']===null&&!$res['json']['data'][0]['needs_delivery'],'Ambiguous legacy web_id/person-only data never supplies enrollment identity');}
        billing_check((int)ac_one($db,'SELECT COUNT(*) AS n FROM billing_invoices')['n']===$before,'Missing enrollment identity creates no duplicate historical or new bill');
        $res=$webhook(array_replace($person,['external_student_id'=>'different-person']));billing_check($res['code']===409,'Same external enrollment cannot be reassigned to another person');
        $res=$webhook(array_replace($person,['source'=>'arbitrary-client-source']));billing_check($res['code']===422,'Client cannot choose an authoritative source namespace');
        $res=$webhook(array_replace($person,['external_student_id'=>'unresolved-legacy-person','external_enrollment_id'=>'unresolved-legacy-enrollment','email'=>'student@test.invalid']));billing_check($res['code']===409,'Unmapped legacy contact collision flags reconciliation without guessing a student owner');
        $res=$webhook(array_replace($person,['program'=>'Kaigo','total_biaya'=>'1777.77']));billing_check($res['code']===200&&$res['json']['data'][0]['pricing_reason']==='enrollment_identity_conflict'&&!$res['json']['data'][0]['needs_delivery'],'Same occurrence cannot silently change program to masquerade as a new enrollment');
        $webhook($person);
        $dated=array_replace($person,['external_student_id'=>'dated-person','external_enrollment_id'=>'dated-enrollment','email'=>'dated@test.invalid']);
        registration_process($db,['id'=>1,'role'=>'finance','name'=>'Test Finance'],$dated,'sync');
        $datedEnrollment=ac_one($db,"SELECT * FROM student_enrollments WHERE external_enrollment_id='dated-enrollment'");
        $datedCharge=ac_one($db,"SELECT * FROM enrollment_charges WHERE enrollment_id=? AND charge_type='program_fee'",[(int)$datedEnrollment['id']]);
        $datedPayload=['action'=>'add_invoice','student_id'=>(int)$datedEnrollment['student_id'],'enrollment_id'=>(int)$datedEnrollment['id'],'charge_id'=>(int)$datedCharge['id'],'bank_account_id'=>1,'tanggal'=>'2026-10-13','jatuhTempo'=>'2026-10-20','total'=>'15000000.50'];
        $datedInvoice=$post($datedPayload);$dated['installments']=[['nominal'=>'15000000.50','jatuhTempo'=>'2026-10-20']];
        $res=$webhook($dated);
        billing_check($res['code']===200&&$res['json']['data'][0]['invoice_id']===$datedInvoice['json']['data']['id']&&!$res['json']['data'][0]['invoice_created_now'],'Later-day webhook replay validates supplied terms against the original charge invoice date');

        $same=enrollment_test_payload($db);$results=$concurrent([['mode'=>'finance','body'=>$same],['mode'=>'finance','body'=>$same]]);
        billing_check($results[0]['code']===200&&$results[1]['code']===200&&$results[0]['data']['id']===$results[1]['data']['id'],'Concurrent same-charge requests return one invoice: '.eb_json($results));
        billing_check((int)ac_one($db,'SELECT COUNT(*) AS n FROM billing_invoices WHERE id=?',[$results[0]['data']['id']])['n']===1,'Database contains exactly one invoice for concurrent replay');
        $one=enrollment_test_payload($db);$two=$one;$fee=ac_one($db,"SELECT * FROM enrollment_charges WHERE enrollment_id=? AND charge_type='registration_fee'",[$one['enrollment_id']]);$two['charge_id']=(int)$fee['id'];$two['total']=$fee['amount'];
        $results=$concurrent([['mode'=>'finance','body'=>$one],['mode'=>'finance','body'=>$two]]);
        billing_check($results[0]['code']===200&&$results[1]['code']===200&&$results[0]['data']['id']!==$results[1]['data']['id'],'Concurrent distinct approved charges within one enrollment receive separate numbers: '.eb_json($results));
        // Distinct bank and COA locks ensure this test exercises the shared number allocator.
        $db->query("INSERT INTO accounts(id,is_active,report_class,code,name,normal_balance) VALUES(6,1,'cash','TEST-6','Independent bank fixture','debit')");
        $db->query("INSERT INTO cash_bank_accounts(id,account_id,bank_name,account_number,account_holder,is_active,name) VALUES(6,6,'Independent Bank','000006','Synthetic Holder Two',1,'Independent fixture')");
        $finance=enrollment_test_payload($db);$finance['bank_account_id']=6;$upstream=array_replace($person,['external_student_id'=>'concurrent-web-person','external_enrollment_id'=>'concurrent-web-enroll','email'=>'concurrent@test.invalid']);
        $results=$concurrent([['mode'=>'finance','body'=>$finance],['mode'=>'webhook','body'=>$upstream]]);
        billing_check($results[0]['code']===200&&$results[1]['code']===200&&$results[0]['data']['id']!==$results[1]['data']['id'],'Concurrent Finance and webhook transactions share atomic numbering: '.eb_json($results));
        $replay=$webhook($upstream);billing_check($replay['code']===200&&$replay['json']['data'][0]['invoice_id']===$results[1]['data']['id']&&!$replay['json']['data'][0]['invoice_created_now'],'Real webhook retry resolves the invoice committed by its concurrent service transaction');
        $upstream=array_replace($person,['external_student_id'=>'same-web-person','external_enrollment_id'=>'same-web-enroll']);$results=$concurrent([['mode'=>'webhook','body'=>$upstream],['mode'=>'webhook','body'=>$upstream]]);
        billing_check($results[0]['code']===200&&$results[1]['code']===200&&$results[0]['data']['id']===$results[1]['data']['id'],'Concurrent webhook registration retries resolve one enrollment and charge');
        $db->begin_transaction();$december=eb_number($db,'2612');$january=eb_number($db,'2701');$db->rollback();
        billing_check(str_starts_with($december,'TGCJ2612')&&str_starts_with($january,'TGCJ2701'),'Atomic allocator separates month/year boundaries');
        $prefix='TGCJ'.(new DateTimeImmutable('now',new DateTimeZone('Asia/Jakarta')))->format('ym');$next=ac_one($db,'SELECT next_value FROM invoice_sequences WHERE prefix=?',[$prefix])['next_value'];
        ac_query($db,'UPDATE invoice_sequences SET next_value=10000 WHERE prefix=?',[$prefix]);
        $res=$post(enrollment_test_payload($db));billing_check($res['code']===409,'Four-digit sequence overflow fails safely without extending or recycling numbers');
        ac_query($db,'UPDATE invoice_sequences SET next_value=? WHERE prefix=?',[(int)$next,$prefix]);
        $rollback=enrollment_test_payload($db);$before=ac_rows($db,'SELECT * FROM billing_invoices ORDER BY id');$sequence=ac_rows($db,'SELECT * FROM invoice_sequences ORDER BY prefix');
        $db->query("CREATE TRIGGER be03_issue_audit_failure BEFORE INSERT ON accounting_audit_logs FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Synthetic audit failure'");$res=$post($rollback);$db->query('DROP TRIGGER be03_issue_audit_failure');
        billing_check($res['code']===500&&ac_rows($db,'SELECT * FROM billing_invoices ORDER BY id')===$before&&ac_rows($db,'SELECT * FROM invoice_sequences ORDER BY prefix')===$sequence&&ac_one($db,'SELECT billing_invoice_id FROM enrollment_charges WHERE id=?',[$rollback['charge_id']])['billing_invoice_id']===null,'Audit failure rolls back committed-number candidate and charge consumption');
        billing_check($post($rollback)['code']===200,'Same business charge succeeds on explicit retry after audit recovery');
        try {ac_query($db,'INSERT INTO enrollment_charges(enrollment_id,charge_type,charge_key,amount,policy_snapshot,policy_hash) SELECT enrollment_id,charge_type,charge_key,amount,policy_snapshot,policy_hash FROM enrollment_charges WHERE id=?',[$base['charge_id']]);throw new RuntimeException('Duplicate charge was accepted');}catch(mysqli_sql_exception $error){billing_check($error->getCode()===1062,'Database enforces enrollment/type/key uniqueness');}
        $history=[ac_rows($db,'SELECT * FROM billing_invoices ORDER BY id'),ac_rows($db,'SELECT * FROM billing_pembayaran ORDER BY id')];enrollment_schema_install($db);enrollment_schema_install($db);
        billing_check([ac_rows($db,'SELECT * FROM billing_invoices ORDER BY id'),ac_rows($db,'SELECT * FROM billing_pembayaran ORDER BY id')]===$history,'Repeated migration on legacy-like database preserves all historical billing and payments');
        billing_check((int)ac_one($db,"SELECT COUNT(*) AS n FROM enrollment_invoice_reconciliation WHERE billing_invoice_id LIKE 'OLD-%'")['n']===3,'Legacy enrollment reconciliation is explicit and has no guessed identity backfill');
        try{enrollment_schema_rollback_empty($db);throw new RuntimeException('Populated rollback accepted');}catch(AccountingException $error){billing_check($error->getCode()===409,'Rollback refuses to destroy enrollment or issued charge data');}
        $empty='one_creativa_accounting_test_'.bin2hex(random_bytes(6));$db->query("CREATE DATABASE $empty CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
        try{$db->query("CREATE TABLE $empty.peserta_intensif LIKE $testName.peserta_intensif");$db->query("CREATE TABLE $empty.billing_invoices LIKE $testName.billing_invoices");$db->select_db($empty);enrollment_schema_install($db);enrollment_schema_install($db);billing_check(ac_table($db,'enrollment_charges')&&(int)ac_one($db,'SELECT COUNT(*) AS n FROM student_enrollments')['n']===0,'Migration is idempotent on empty isolated parent tables');
        $db->query('ALTER TABLE student_enrollments ADD UNIQUE accidental_student_unique(student_id)');
        try{enrollment_schema_install($db);throw new RuntimeException('Unexpected student uniqueness accepted');}catch(AccountingException $error){billing_check($error->getCode()===409,'Migration rejects an existing one-enrollment-per-student constraint');}
        $db->query('ALTER TABLE student_enrollments DROP INDEX accidental_student_unique');enrollment_schema_rollback_empty($db);billing_check(!ac_table($db,'student_enrollments')&&ac_table($db,'billing_invoices')&&ac_table($db,'peserta_intensif'),'Empty migration rollback preserves parent/legacy tables');enrollment_schema_install($db);billing_check(ac_table($db,'enrollment_charges'),'Migration can be reapplied after empty rollback');
        $db->query("INSERT INTO billing_invoices(id,total,status,meta_json) VALUES('TGCJ26090042',1000,'Paid','{}')");
        enrollment_schema_install($db);
        billing_check((int)ac_one($db,"SELECT next_value FROM invoice_sequences WHERE prefix='TGCJ2609'")['next_value']===43&&ac_one($db,"SELECT status FROM billing_invoices WHERE id='TGCJ26090042'")['status']==='Paid','Legacy canonical invoice high-water mark initializes the allocator without rewriting Paid history');}finally{$db->select_db($testName);$db->query("DROP DATABASE $empty");}
    } finally {$configure($catalog);}
    echo 'PASS: '.($GLOBALS['checks']-$start)." BE-03 lifecycle, concurrency and migration checks.\n";
}
