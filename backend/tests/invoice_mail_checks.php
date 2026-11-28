<?php
function invoice_mail_checks(mysqli $db, string $database, callable $send, string $cookie, string $csrf, array $legacy): void {
    require_once __DIR__.'/../services/invoice_mail.php';
    $dir=sys_get_temp_dir().'/creativa-invoice-smtp-test-'.bin2hex(random_bytes(6)); mkdir($dir);
    $configFile=sys_get_temp_dir().'/'.$database.'_invoice_mail.json';
    $smtp=null; $worker=null; $documents=null; $before=$GLOBALS['checks'];
    $freePort=static function (): int {
        $socket=stream_socket_server('tcp://127.0.0.1:0',$errno,$error);
        if (!$socket) throw new RuntimeException('Local fixture port unavailable');
        $address=stream_socket_get_name($socket,false); fclose($socket);
        return (int)substr($address,strrpos($address,':')+1);
    };
    $spawn=static function (array $command, string $log) {
        $process=proc_open($command,[['pipe','r'],['file',$log,'a'],['file',$log,'a']],$pipes,dirname(__DIR__,2));
        if (!is_resource($process)) throw new RuntimeException('Local fixture cannot start');
        fclose($pipes[0]); return $process;
    };
    try {
        file_put_contents($dir.'/openssl.cnf',"[req]\ndistinguished_name=dn\n[dn]\n[server]\nsubjectAltName=DNS:localhost\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,digitalSignature,keyEncipherment,keyCertSign\n");
        $key=openssl_pkey_new(['config'=>$dir.'/openssl.cnf','private_key_bits'=>2048,'private_key_type'=>OPENSSL_KEYTYPE_RSA]);
        $csr=openssl_csr_new(['commonName'=>'localhost'],$key,['config'=>$dir.'/openssl.cnf','digest_alg'=>'sha256']);
        $certificate=openssl_csr_sign($csr,null,$key,1,['config'=>$dir.'/openssl.cnf','x509_extensions'=>'server','digest_alg'=>'sha256']);
        if (!$certificate) throw new RuntimeException('Local SMTP test certificate failed');
        openssl_x509_export($certificate,$certText); openssl_pkey_export($key,$keyText,null,['config'=>$dir.'/openssl.cnf']);
        file_put_contents($dir.'/ca.pem',$certText); file_put_contents($dir.'/server.pem',$certText.$keyText);
        $smtp=$spawn([PHP_BINARY,__DIR__.'/invoice_smtp_fixture.php',$dir],$dir.'/smtp.log');
        for ($i=0;$i<100 && !is_file($dir.'/ready.json');$i++) usleep(100000);
        if (!is_file($dir.'/ready.json')) throw new RuntimeException('SMTP fixture readiness failed');
        $smtpPort=json_decode(file_get_contents($dir.'/ready.json'),true)['port'];
        $documentPort=$freePort();
        $documents=$spawn([PHP_BINARY,'-S','127.0.0.1:'.$documentPort,__DIR__.'/budget_test_router.php'],$dir.'/documents.log');
        $workerPort=$freePort();
        putenv('PORT='.$workerPort); putenv('WORKER_SECRET=invoice-local-worker-only'); putenv('ALLOWED_RENDER_ORIGINS=http://127.0.0.1');
        $chrome=getenv('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH') ?: 'C:/Program Files/Google/Chrome/Application/chrome.exe';
        putenv('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='.$chrome);
        $worker=$spawn(['node',dirname(__DIR__,2).'/automation/playwright-pdf-worker.mjs'],$dir.'/worker.log');
        for ($i=0;$i<100;$i++) {
            $health=@file_get_contents('http://127.0.0.1:'.$workerPort.'/health');
            if ($health) break;
            usleep(100000);
        }
        if (!$health) throw new RuntimeException('Real Playwright worker unavailable: '.file_get_contents($dir.'/worker.log'));
        $config=['host'=>'localhost','port'=>$smtpPort,'encryption'=>'ssl','username'=>'fixture-user','password'=>'fixture-password',
            'from_email'=>'finance@example.test','from_name'=>'Finance Uji','ca_file'=>$dir.'/ca.pem',
            'invoice_email_sender'=>'php','invoice_cc_tiffa'=>'tiffa@example.test','invoice_cc_alfin'=>'alfin@example.test',
            'invoice_pdf_required'=>true,'invoice_pdf_worker_url'=>'http://127.0.0.1:'.$workerPort,'invoice_pdf_worker_secret'=>'invoice-local-worker-only',
            'invoice_api_base_url'=>'http://127.0.0.1:'.$documentPort.'/api'];
        $write=static function (array $changes=[]) use (&$config,$configFile): void { file_put_contents($configFile,json_encode(array_replace($config,$changes),JSON_THROW_ON_ERROR)); };
        $write();
        $meta=['program'=>'Program Snapshot Resmi','skema'=>'Cicilan','bank_name'=>'Bank Snapshot','account_number'=>'001-234','account_holder'=>'PT LPK CREATIVA',
            'items'=>[['description'=>'Biaya program','price'=>'1000.25','amount'=>'1000.25','qty'=>1]],'subtotal'=>'1000.25','discount'=>['amount'=>'0.00'],
            'installments'=>[['label'=>'DP','nominal'=>'200.00','jatuhTempo'=>'2026-12-01'],['label'=>'Pelunasan','nominal'=>'800.25','jatuhTempo'=>'2027-01-01']]];
        ac_query($db,'INSERT INTO billing_invoices(id,tanggal,customer,email,phone,total,status,jatuhTempo,keterangan,meta_json,public_token) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
            ['MAIL-PAID','2026-11-14','Siswa Uji','student@example.test','', '1000.25','Paid','2026-12-01','Program Snapshot Resmi',json_encode($meta),str_repeat('a',32)]);
        ac_query($db,"INSERT INTO billing_pembayaran(noInv,tglBayar,jumlah,statusVerif) VALUES('MAIL-PAID','2026-11-14','1000.25','Terverifikasi')");
        $invoiceBefore=ac_one($db,"SELECT * FROM billing_invoices WHERE id='MAIL-PAID'");
        $paymentsBefore=ac_rows($db,'SELECT * FROM billing_pembayaran ORDER BY id');
        $deliveryBefore=ac_rows($db,'SELECT * FROM billing_terkirim ORDER BY id');
        $request=static function (string $id='MAIL-PAID', ?int $previous=null): array { return ['action'=>'send_invoice_email','invoice_id'=>$id,'request_id'=>bin2hex(random_bytes(16)),'previous_attempt_id'=>$previous]; };
        $post=static function (array $body) use ($send,$cookie,$csrf): array { return $send('billing.php',$body,$cookie,$csrf); };
        $latest=static function () use ($db): ?array { return ac_one($db,"SELECT * FROM automation_logs WHERE invoice_id='MAIL-PAID' AND stage='invoice_email' ORDER BY id DESC LIMIT 1"); };
        $next=static function () use ($request,$latest): array { $last=$latest(); return $request('MAIL-PAID',$last?(int)$last['id']:null); };
        $count=static function () use ($dir): int { return is_file($dir.'/received.jsonl')?count(file($dir.'/received.jsonl',FILE_IGNORE_NEW_LINES)):0; };
        billing_check($send('billing.php',$request())['code']===401,'Email send requires authentication');
        billing_check($send('billing.php',$request(),$cookie)['code']===403,'Email send requires CSRF');
        $other=$send('login.php',['email'=>'sensei@test','password'=>'isolated-test-only']);
        $otherCsrf=$send('session.php',null,$other['cookie'])['json']['csrf_token'];
        billing_check($send('billing.php',$request(),$other['cookie'],$otherCsrf)['code']===403,'Email send requires Finance prepare permission');
        billing_check($post($request('NOT-FOUND'))['code']===404,'Invalid invoice returns 404 without SMTP');
        $write(['host'=>'']); $missingConfig=$next(); $result=$post($missingConfig);
        billing_check($result['code']===409 && $latest()['status']==='Failed' && $count()===0,'Missing SMTP config logs Failed and never sends');
        billing_check($post($missingConfig)['code']===409 && $count()===0,'Configuration failure replay preserves original HTTP status');
        $write(['invoice_email_sender'=>'n8n']);
        billing_check($post($next())['code']===409 && $count()===0,'n8n-owned email cannot also send through PHP');
        $write(['invoice_cc_tiffa'=>'invalid-address']);
        billing_check($post($next())['code']===409 && $count()===0,'Invalid private CC fails safely');
        $write(); $invalid=$request('OLD-0');
        billing_check($post($invalid)['code']===422 && $count()===0,'Missing saved recipient email fails without fallback');
        ac_query($db,"UPDATE billing_invoices SET email='invalid-email' WHERE id='MAIL-PAID'");
        billing_check($post($next())['code']===422,'Malformed saved recipient email rejected');
        ac_query($db,"UPDATE billing_invoices SET email='student@example.test' WHERE id='MAIL-PAID'");
        $write(['invoice_pdf_worker_url'=>'']);
        billing_check($post($next())['code']===409 && $count()===0,'Required PDF worker missing prevents email');
        $write(['invoice_pdf_worker_secret'=>'wrong-local-secret']);
        billing_check($post($next())['code']===502 && $count()===0,'Worker rejection cannot become a fake PDF attachment');
        $write();
        $incomplete=$meta; unset($incomplete['installments']);
        ac_query($db,"UPDATE billing_invoices SET meta_json=? WHERE id='MAIL-PAID'",[json_encode($incomplete)]);
        billing_check($post($next())['code']===409 && $count()===0,'Missing saved terms never turn into a guessed full-payment email');
        $incomplete=$meta; unset($incomplete['account_holder']);
        ac_query($db,"UPDATE billing_invoices SET meta_json=? WHERE id='MAIL-PAID'",[json_encode($incomplete)]);
        billing_check($post($next())['code']===409 && $count()===0,'Missing bank snapshot never falls back to current master/hardcoded bank');
        ac_query($db,"UPDATE billing_invoices SET meta_json=?,status='Draft' WHERE id='MAIL-PAID'",[json_encode($meta)]);
        billing_check($post($next())['code']===422 && $count()===0,'Draft invoice is not eligible for official email');
        ac_query($db,"UPDATE billing_invoices SET status='Paid' WHERE id='MAIL-PAID'");
        $spoof=$send('automation_status.php',['secret'=>$database,'action'=>'mark_delivery','invoice_id'=>'MAIL-PAID','stage'=>' INVOICE_EMAIL ','kanal'=>'Email','statusKirim'=>'Terkirim']);
        billing_check($spoof['code']===422,'n8n callbacks cannot fabricate PHP SMTP acceptance evidence');
        $body=$next(); $body['email']='forged@example.test'; $body['total']='1.00';
        $result=$post($body); $attempt=$result['json']['data']['attempt'] ?? [];
        billing_check($result['code']===200 && ($attempt['status']??'')==='SMTP Accepted' && $count()===1,'Existing valid Paid invoice submitted to local SMTP');
        billing_check(($attempt['cc']??[])===['tiffa@example.test','alfin@example.test'],'Both private Finance CC settings honored');
        $received=json_decode(file($dir.'/received.jsonl',FILE_IGNORE_NEW_LINES)[0],true);
        billing_check(count($received['recipients'])===3 && str_contains($received['message'],'Cc:') && str_contains($received['message'],'multipart/alternative'),'SMTP envelope includes original recipient and CC with HTML/plain alternatives');
        billing_check(!str_contains(json_encode($received['recipients']),'forged@example.test'),'Client recipient override is ignored in favor of the saved invoice');
        preg_match_all('/Content-Transfer-Encoding: base64\r?\n(?:[^\r\n]+\r?\n)*\r?\n([A-Za-z0-9+\/=\r\n]+)/',$received['message'],$blocks);
        $decoded=''; $pdf=null;
        foreach ($blocks[1] as $block) { $bytes=base64_decode(preg_replace('/\s/','',$block)); $decoded.=$bytes; if(str_starts_with($bytes,'%PDF-'))$pdf=$bytes; }
        billing_check($attempt['pdf_attached'] && is_string($pdf) && str_contains(substr($pdf,-1024),'%%EOF'),'Actual official document rendered by Playwright and attached as real PDF');
        $document=file_get_contents($config['invoice_api_base_url'].'/invoice_document.php?id=MAIL-PAID&token='.str_repeat('a',32));
        billing_check(str_contains($document,'PT LPK CREATIVA') && str_contains($document,'001-234'),'Official renderer retains exact persisted bank snapshot');
        billing_check(str_contains($decoded,'1000.25') && str_contains($decoded,'Program Snapshot Resmi') && str_contains($decoded,'2026-12-01') && str_contains($decoded,'invoice_document.php?id=MAIL-PAID'),'Email contains original number/program/amount/terms/date/document link');
        billing_check(str_contains($decoded,'PT LPK CREATIVA') && !str_contains($decoded,'fixture-password'),'Original bank holder retained without credentials in email');
        $result=$post($body);
        billing_check($result['code']===200 && $result['json']['data']['replayed'] && $count()===1,'Duplicate click/network retry returns same attempt without another message');
        $caseReplay=$body; $caseReplay['invoice_id']='mail-paid';
        billing_check($post($caseReplay)['code']===200 && $count()===1,'Legacy case-insensitive invoice aliases resolve to the same stored identity');
        billing_check($post($request())['code']===409 && $count()===1,'Fresh request with stale history cannot bypass resend confirmation');
        $resend=$next();
        billing_check($post($resend)['code']===200 && $count()===2,'Explicit resend uses same invoice and preserves prior attempt');
        file_put_contents($dir.'/mode','rejected'); $reject=$next(); $result=$post($reject);
        billing_check($result['code']===502 && $latest()['status']==='Failed' && !$result['json']['data']['attempt']['delivery_uncertain'],'SMTP DATA rejection returns failure with server record');
        $beforeReplay=$count(); billing_check($post($reject)['code']===502 && $count()===$beforeReplay,'Failed request replay never retries SMTP automatically');
        file_put_contents($dir.'/mode','partial'); $result=$post($next());
        billing_check($result['code']===502 && $result['json']['data']['attempt']['delivery_uncertain'],'Partial CC rejection tracked as uncertain, not false all-recipient success');
        $beforePartial=$count(); billing_check($post($next())['code']===409 && $count()===$beforePartial,'Partial acceptance blocks a fresh automatic retry');
        // Explicit isolated-fixture-only operator resolution to exercise the next failure mode.
        $row=$latest(); $detail=json_decode($row['detail_json'],true); $detail['delivery_uncertain']=false;
        ac_query($db,'UPDATE automation_logs SET detail_json=? WHERE id=?',[json_encode($detail),$row['id']]);
        file_put_contents($dir.'/mode','uncertain'); $result=$post($next());
        billing_check($result['code']===502 && $result['json']['data']['attempt']['delivery_uncertain'],'Disconnect after DATA is uncertain and cannot report success');
        $row=$latest(); $detail=json_decode($row['detail_json'],true); $detail['delivery_uncertain']=false;
        ac_query($db,'UPDATE automation_logs SET status=\'Pending\',detail_json=? WHERE id=?',[json_encode($detail),$row['id']]);
        $pendingCount=$count(); billing_check($post($next())['code']===409 && $count()===$pendingCount,'Crash-like Pending attempt blocks duplicate sending');
        $row=$latest(); ac_query($db,"UPDATE automation_logs SET status='Failed' WHERE id=?",[$row['id']]);
        $locker=ac_one($db,'SELECT CONNECTION_ID() AS id');
        $lock=substr('invoice-email:'.hash('sha256','MAIL-PAID'),0,64);
        ac_query($db,'SELECT GET_LOCK(?,0)',[$lock]);
        $caseConcurrent=$next(); $caseConcurrent['invoice_id']='mail-paid';
        try { billing_check($post($caseConcurrent)['code']===409 && $count()===$pendingCount,'Concurrent send uses canonical invoice advisory lock even for case aliases'); }
        finally { ac_query($db,'SELECT RELEASE_LOCK(?)',[$lock]); }
        file_put_contents($dir.'/mode','accepted');
        $write(['invoice_pdf_required'=>false,'invoice_pdf_worker_url'=>'','invoice_cc_tiffa'=>'','invoice_cc_alfin'=>'']);
        $result=$post($next());
        billing_check($result['code']===200 && !$result['json']['data']['attempt']['pdf_attached'] && $result['json']['data']['attempt']['cc']===[],'Explicit optional-PDF policy supports link-only with empty CC placeholders');
        $logged=ac_rows($db,"SELECT * FROM automation_logs WHERE stage='invoice_email' ORDER BY id");
        $encoded=json_encode($logged);
        billing_check(!str_contains($encoded,'fixture-password') && !str_contains($encoded,'TOKEN_SECRET') && !str_contains($encoded,str_repeat('a',32)) && !str_contains($encoded,'invoice-local-worker-only'),'Attempt logs redact credentials, raw SMTP payload/replies and document tokens');
        billing_check((int)ac_one($db,"SELECT COUNT(*) AS n FROM accounting_audit_logs WHERE entity_id='MAIL-PAID' AND action='email_requested'")['n']>0,'Server audit records send attempts');
        $history=$send('billing.php?view=email_attempts&invoice_id=MAIL-PAID',null,$cookie);
        billing_check($history['code']===200 && count($history['json']['data']['attempts'])===count(array_filter($logged,fn($row)=>$row['invoice_id']==='MAIL-PAID')),'Authenticated history preserves all attempts');
        $all=$send('billing.php',null,$cookie);
        $mapped=array_column($all['json']['data']['invoices']??[],null,'id');
        billing_check($all['code']===200 && ($mapped['MAIL-PAID']['email_delivery']['status']??'')==='SMTP Accepted' && count($all['json']['data']['email_attempts'])>1,'Finance GET exposes actual latest SMTP status and attempt history');
        billing_check(ac_one($db,"SELECT * FROM billing_invoices WHERE id='MAIL-PAID'")===$invoiceBefore,'Existing Paid invoice identity, amount, metadata and status remain unchanged');
        billing_check(ac_rows($db,'SELECT * FROM billing_pembayaran ORDER BY id')===$paymentsBefore,'Existing verified payment history remains byte-for-byte unchanged');
        billing_check(ac_rows($db,'SELECT * FROM billing_terkirim ORDER BY id')===$deliveryBefore,'Email attempts do not invent legacy delivery/read records');
        billing_check(ac_rows($db,"SELECT * FROM billing_invoices WHERE id LIKE 'OLD-%' ORDER BY id")===$legacy,'Historical invoices remain compatible after email failure/success');
        // An audit failure must stop BEFORE any external SMTP work.
        $db->query("CREATE TRIGGER fail_email_audit BEFORE INSERT ON accounting_audit_logs FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test audit failure'");
        $loggedBefore=(int)ac_one($db,"SELECT COUNT(*) AS n FROM automation_logs WHERE stage='invoice_email'")['n']; $messagesBefore=$count();
        try { $result=$post($next()); } finally { $db->query('DROP TRIGGER fail_email_audit'); }
        billing_check($result['code']===500 && $count()===$messagesBefore && (int)ac_one($db,"SELECT COUNT(*) AS n FROM automation_logs WHERE stage='invoice_email'")['n']===$loggedBefore,'Audit failure rolls back Pending and sends no message');
        echo 'PASS: '.($GLOBALS['checks']-$before)." M3.1 local TLS SMTP / real Playwright PDF / API checks. No external mail sent.\n";
        if (defined('RUN_RECEIPT_TESTS') && RUN_RECEIPT_TESTS) {
            require __DIR__.'/receipt_checks.php';
            receipt_checks($db,$database,$send,$cookie,$csrf,$dir,$config,$write,$count);
        }
    } finally {
        foreach ([$worker,$documents,$smtp] as $process) if (is_resource($process)) { proc_terminate($process); proc_close($process); }
        if (is_file($configFile)) unlink($configFile);
        foreach (['PORT','WORKER_SECRET','ALLOWED_RENDER_ORIGINS','PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'] as $key) putenv($key);
        foreach (['openssl.cnf','ca.pem','server.pem','smtp.log','ready.json','received.jsonl','mode','documents.log','worker.log'] as $file) if (is_file($dir.'/'.$file)) unlink($dir.'/'.$file);
        rmdir($dir);
    }
}
