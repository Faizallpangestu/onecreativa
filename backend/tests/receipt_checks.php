<?php
function receipt_checks(mysqli $db,string $database,callable $send,string $cookie,string $csrf,string $dir,array $config,callable $write,callable $count): void {
    require_once __DIR__.'/../services/billing_receipts.php';
    $start=$GLOBALS['checks']; $root=sys_get_temp_dir().'/'.$database.'_documents';
    $oldRoot=getenv('CREATIVA_PRIVATE_UPLOAD_DIR');putenv('CREATIVA_PRIVATE_UPLOAD_DIR='.$root);
    if(!is_dir($root.'/student_payments'))mkdir($root.'/student_payments',0750,true);
    $files=[];
    $post=fn($body)=>$send('billing.php',$body,$cookie,$csrf);
    $invoice=function(string $id,string $total='1000.25',string $status='Unpaid')use($db):void{
        ac_query($db,'INSERT INTO billing_invoices(id,tanggal,customer,email,phone,total,status,jatuhTempo,keterangan,meta_json,public_token) VALUES(?,?,?,?,?,?,?,?,?,?,?)',[$id,'2026-11-14','Receipt Uji','receipt@example.test','',$total,$status,'2026-12-01','Program Resmi',json_encode(['student_id'=>1,'program'=>'Program Resmi']),str_repeat('b',32)]);
    };
    $proof=function()use($root,&$files):string{
        $name=bin2hex(random_bytes(16)).'.png';$path=$root.'/student_payments/'.$name;
        file_put_contents($path,base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jK8sAAAAASUVORK5CYII=').random_bytes(8));$files[]=$path;
        return 'student_payments/'.$name;
    };
    $pending=function(string $id,string $amount='1000.25',?string $path=null)use($db,$proof):int{
        $path=$path??$proof();ac_query($db,"INSERT INTO billing_pembayaran(noInv,tglBayar,customer,metode,jumlah,sisa,statusVerif,proof_path) VALUES(?,'2026-11-14','Receipt Uji','Transfer Bank',?,'1000.25','Menunggu',?)",[$id,$amount,$path]);return (int)$db->insert_id;
    };
    $verify=fn($id,$inv)=>['action'=>'verify_payment','payment_id'=>$id,'invoice_id'=>$inv,'request_id'=>bin2hex(random_bytes(16))];
    $email=fn($id,$previous=null)=>['action'=>'send_receipt_email','payment_id'=>$id,'request_id'=>bin2hex(random_bytes(16)),'previous_attempt_id'=>$previous];
    try {
        file_put_contents($dir.'/mode','accepted');$write(['receipt_email_sender'=>'php']);
        $invoice('RCPT-FULL');$id=$pending('RCPT-FULL');$body=$verify($id,'RCPT-FULL');
        billing_check($send('billing.php',$body)['code']===401,'Receipt Verify requires login');
        billing_check($send('billing.php',$body,$cookie)['code']===403,'Receipt Verify requires CSRF');
        $countBefore=$count();$result=$post($body);$r=$result['json']['data']??[];
        billing_check($result['code']===200 && ($r['payment_status']??'')==='Verified' && $r['status']==='Paid','Verify updates intended pending payment and full invoice balance');
        billing_check($r['payment_id']===$id && $r['receipt_number']===rpa_format_receipt_number($id,'2026-11-14'),'One persisted payment has its deterministic official receipt identity');
        billing_check($r['email_status']==='SMTP Accepted' && $r['pdf_status']==='Available' && $count()===$countBefore+1,'Verify automatically generates real receipt PDF and submits SMTP');
        $saved=ac_one($db,'SELECT * FROM billing_pembayaran WHERE id=?',[$id]);
        billing_check($saved['statusVerif']==='Terverifikasi' && str_starts_with($saved['proof_path'],'student_payments/'),'Existing proof and payment ID are preserved');
        $result=$post($body);
        billing_check($result['code']===200 && !$result['json']['data']['verified_now'] && $count()===$countBefore+1,'Same verification request replays without payment or email duplication');
        billing_check($post($verify($id,'RCPT-FULL'))['json']['data']['payment_id']===$id && $count()===$countBefore+1,'Already verified payment returns existing result under a different Verify key');
        billing_check($post($verify($id,'MAIL-PAID'))['code']===409,'Cross-invoice payment verification rejected');
        $invoice('RCPT-NOPROOF');$bad=$pending('RCPT-NOPROOF','1000.25','');
        billing_check($post($verify($bad,'RCPT-NOPROOF'))['code']===422,'Missing saved payment proof cannot be verified');
        ac_query($db,'UPDATE billing_pembayaran SET proof_path=? WHERE id=?',['student_payments/'.str_repeat('e',32).'.png',$bad]);
        billing_check($post($verify($bad,'RCPT-NOPROOF'))['code']===404,'Missing physical proof cannot be verified');
        $invoice('RCPT-PARTIAL');$a=$pending('RCPT-PARTIAL','300.10');$first=$post($verify($a,'RCPT-PARTIAL'))['json']['data'];
        billing_check($first['status']==='Partially Paid' && $first['terbayar']==='300.10' && $first['sisa']==='700.15','Partial receipt uses precise verified amount and remaining balance');
        $b=$pending('RCPT-PARTIAL','700.15');$second=$post($verify($b,'RCPT-PARTIAL'))['json']['data'];
        billing_check($second['status']==='Paid' && $second['sisa']==='0.00' && $second['receipt_number']!==$first['receipt_number'],'Two verified payments produce two distinct receipts');
        $snap=receipt_snapshot($db,$a);
        billing_check($snap['paid_total']==='300.10' && $snap['remaining']==='700.15' && $snap['payment_ids']===[$a],'First official receipt snapshot stays partial after a later payment');
        $url=$config['invoice_api_base_url'].'/receipt_document.php?payment_id='.$a.'&token='.str_repeat('b',32);
        $html=file_get_contents($url);
        billing_check(str_contains($html,$first['receipt_number']) && str_contains($html,'300,10') && str_contains($html,'700,15') && !str_contains($html,$second['receipt_number']),'Exact payment_id template renders its own identity/amount/cumulative balance');
        $pdf=receipt_pdf($db,$snap,array_replace($config,['receipt_email_sender'=>'php']));
        billing_check(str_starts_with($pdf,'%PDF-') && str_contains(substr($pdf,-1024),'%%EOF'),'Receipt is real Playwright PDF binary, not renamed HTML');
        $pdfFile=$dir.'/receipt-inspect.pdf';file_put_contents($pdfFile,$pdf);$files[]=$pdfFile;
        $script='import sys;sys.path.insert(0,sys.argv[1]);from pypdf import PdfReader;print(" ".join(p.extract_text() for p in PdfReader(sys.argv[2]).pages))';
        $process=proc_open(['python','-c',$script,dirname(__DIR__,2).'/.m32-pdf-tools',$pdfFile],[['pipe','r'],['pipe','w'],['pipe','w']],$pipes);fclose($pipes[0]);$text=stream_get_contents($pipes[1]);$error=stream_get_contents($pipes[2]);fclose($pipes[1]);fclose($pipes[2]);$code=proc_close($process);
        billing_check($code===0 && str_contains($text,$first['receipt_number']) && str_contains($text,'RCPT-PARTIAL') && str_contains($text,'300,10') && str_contains($text,'700,15') && str_contains($text,'Transfer Bank'),'Extracted real PDF text contains correct saved payment data: '.$error);
        $captured=json_decode(file($dir.'/received.jsonl',FILE_IGNORE_NEW_LINES)[1+$countBefore],true);
        billing_check(str_contains($captured['message'],'.pdf') && count($captured['recipients'])===3,'Receipt SMTP includes PDF and existing Tiffa/Alfin CC config');
        $history=$send('billing.php?view=receipt_email_attempts&payment_id='.$a,null,$cookie)['json']['data']['attempts'];
        billing_check(count($history)===1 && $history[0]['payment_id']===$a && $history[0]['receipt_number']===$first['receipt_number'],'Receipt attempt history is scoped to payment identity');
        $before=$count();$resend=$email($a,$history[0]['id']);$res=$post($resend);
        billing_check($res['code']===200 && $count()===$before+1,'Explicit receipt resend sends the same receipt');
        billing_check($post($resend)['code']===200 && $count()===$before+1,'Same email request key replays without another SMTP submission');
        billing_check((int)ac_one($db,"SELECT COUNT(*) AS n FROM billing_pembayaran WHERE noInv='RCPT-PARTIAL'")['n']===2,'Resend creates no additional payment');
        billing_check($post($email($b,$history[0]['id']))['code']===409,'Different receipt histories cannot be confused');
        $invoice('RCPT-CENTS','0.25');$centId=$pending('RCPT-CENTS','0.25');$centResult=$post($verify($centId,'RCPT-CENTS'));
        $centHtml=file_get_contents($config['invoice_api_base_url'].'/receipt_document.php?payment_id='.$centId.'&token='.str_repeat('b',32));
        billing_check($centResult['code']===200 && str_contains($centHtml,'Nol Rupiah Dua Puluh Lima Sen'),'Sub-rupiah decimal amount is preserved in official receipt words');
        $invoice('RCPT-PAID-LEGACY','1000.25','Paid');
        billing_check($post($email(999999))['code']===404,'Paid invoice without a real verified payment cannot manufacture a receipt');
        $invoice('RCPT-SMTP-OFF');$off=$pending('RCPT-SMTP-OFF');$write(['receipt_email_sender'=>'php','host'=>'']);$res=$post($verify($off,'RCPT-SMTP-OFF'));
        billing_check($res['code']===200 && $res['json']['data']['payment_status']==='Verified' && $res['json']['data']['email_status']==='Failed' && $res['json']['data']['pdf_status']==='Available' && $res['json']['data']['email']['attempt']['pdf_generated'] && !$res['json']['data']['email']['attempt']['pdf_attached'],'Missing SMTP leaves payment Verified and PDF available without claiming a submitted attachment');
        $invoice('RCPT-DISABLED');$disabled=$pending('RCPT-DISABLED');$write(['receipt_email_sender'=>'']);$res=$post($verify($disabled,'RCPT-DISABLED'));
        billing_check($res['code']===200 && $res['json']['data']['email_status']==='Failed','Receipt email stays disabled until configured');
        $invoice('RCPT-REJECT');$reject=$pending('RCPT-REJECT');file_put_contents($dir.'/mode','rejected');$write(['receipt_email_sender'=>'php']);$res=$post($verify($reject,'RCPT-REJECT'));
        billing_check($res['code']===200 && $res['json']['data']['payment_status']==='Verified' && $res['json']['data']['email_status']==='Failed','SMTP rejection never rolls back successful payment verification');
        $invoice('RCPT-PDF-FAIL');$pdfFail=$pending('RCPT-PDF-FAIL');file_put_contents($dir.'/mode','accepted');$write(['receipt_email_sender'=>'php','invoice_pdf_worker_secret'=>'bad-local-secret']);$before=$count();$res=$post($verify($pdfFail,'RCPT-PDF-FAIL'));
        billing_check($res['code']===200 && $res['json']['data']['payment_status']==='Verified' && $res['json']['data']['receipt_status']==='Available' && $res['json']['data']['email_status']==='Failed' && $count()===$before,'PDF failure is logged separately with no SMTP and no payment reversal');
        $write(['receipt_email_sender'=>'php']);$h=receipt_mail_history($db,$pdfFail);$res=$post($email($pdfFail,$h[0]['id']));
        billing_check($res['code']===200 && receipt_snapshot($db,$pdfFail)['payment_id']===$pdfFail,'Email-only retry recovers PDF and sends existing verified receipt');
        $invoice('RCPT-UNCERTAIN');$uncertain=$pending('RCPT-UNCERTAIN');file_put_contents($dir.'/mode','uncertain');$res=$post($verify($uncertain,'RCPT-UNCERTAIN'));
        billing_check($res['code']===200 && $res['json']['data']['email']['attempt']['delivery_uncertain'],'Lost final SMTP response keeps Verified payment and an uncertain delivery result');
        $before=$count();$post($verify($uncertain,'RCPT-UNCERTAIN'));
        billing_check($count()===$before,'Verify replay reconciles uncertain SMTP without resending');
        $invoice('RCPT-OLD-VERIFIED');$old=$pending('RCPT-OLD-VERIFIED','300.10');ac_query($db,"UPDATE billing_pembayaran SET statusVerif='Terverifikasi',sisa='700.15' WHERE id=?",[$old]);file_put_contents($dir.'/mode','accepted');
        billing_check($post($email($old))['code']===200,'Existing verified payment with no email history can send one real receipt');
        $later=$pending('RCPT-OLD-VERIFIED','700.15');$post($verify($later,'RCPT-OLD-VERIFIED'));
        billing_check(receipt_snapshot($db,$old)['remaining']==='700.15','First official legacy delivery freezes actual verified totals before a later payment');
        $invoice('RCPT-OVERPAY');$over=$pending('RCPT-OVERPAY','1000.26');
        billing_check($post($verify($over,'RCPT-OVERPAY'))['code']===409 && !bp_verified(ac_one($db,'SELECT * FROM billing_pembayaran WHERE id=?',[$over])),'Overpayment is rejected transactionally');
        $manual=['action'=>'approve_payment','invoice_id'=>'RCPT-OVERPAY','request_id'=>bin2hex(random_bytes(16)),'tglBayar'=>'2026-11-14','jumlah'=>'100.00','metode'=>'Tunai'];$res=$post($manual);$manualId=$res['json']['data']['payment_id'];
        billing_check($res['code']===200 && $res['json']['data']['payment_status']==='Verified','Existing direct Finance manual payment shares receipt/email pipeline');
        billing_check($post($manual)['json']['data']['payment_id']===$manualId,'Manual payment stable-key retry does not insert a second transaction');
        $found=$send('billing.php?view=payment_request&request_id='.$manual['request_id'],null,$cookie)['json']['data']['payment'];
        billing_check($found['payment_id']===$manualId,'Lost verification response reconciles by stable server request history');
        $invoice('RCPT-CONCURRENT');$concurrent=$pending('RCPT-CONCURRENT');$barrier=sys_get_temp_dir().'/'.$database.'_verify_barrier';$jobs=[];
        for($i=0;$i<2;$i++){$file=sys_get_temp_dir().'/'.$database.'_verify_'.$i.'.json';$files[]=$file;file_put_contents($file,json_encode(['actor'=>$i?3:1,'body'=>$verify($concurrent,'RCPT-CONCURRENT')]));$proc=proc_open([PHP_BINARY,__DIR__.'/receipt_verify_worker.php',$database,$file,$barrier],[['pipe','r'],['pipe','w'],['pipe','w']],$pipes);fclose($pipes[0]);$jobs[]=[$proc,$pipes];}
        file_put_contents($barrier,'ready');$files[]=$barrier;$out=[];
        foreach($jobs as [$proc,$pipes]){$out[]=json_decode(stream_get_contents($pipes[1]),true);fclose($pipes[1]);fclose($pipes[2]);proc_close($proc);}
        billing_check($out[0]['code']===200 && $out[1]['code']===200 && count(array_filter($out,fn($x)=>$x['data']['verified_now']))===1,'Two concurrent Finance actors verify the same persisted payment exactly once: '.json_encode($out));
        billing_check((int)ac_one($db,"SELECT COUNT(*) AS n FROM accounting_audit_logs WHERE entity_type='billing_payment' AND entity_id=? AND action='verified'",[(string)$concurrent])['n']===1,'Concurrent Verify produces one verification audit/receipt snapshot');
        $invoice('RCPT-DUP-PROOF');$path=$proof();$dup1=$pending('RCPT-DUP-PROOF','100.00',$path);$dup2=$pending('RCPT-DUP-PROOF','100.00',$path);
        billing_check($post($verify($dup1,'RCPT-DUP-PROOF'))['code']===409,'One saved proof cannot be recognized as two payment records');
        // Mirror the real separate submission storage; do not remove its accounting review constraint.
        $db->query('DROP TABLE student_payment_submissions');
        $db->query("CREATE TABLE student_payment_submissions(id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,invoice_link_id BIGINT UNSIGNED,student_id INT,amount DECIMAL(15,2),transfer_date DATE,reference VARCHAR(180),proof_file VARCHAR(255),request_key VARCHAR(100) UNIQUE,status ENUM('pending','accepted','rejected') DEFAULT 'pending',transaction_id BIGINT UNSIGNED NULL,review_notes TEXT,reviewed_by INT UNSIGNED NULL,reviewed_at DATETIME NULL,submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,CHECK(status<>'accepted' OR transaction_id IS NOT NULL)) ENGINE=InnoDB");
        $invoice('RCPT-STUDENT');ac_query($db,'INSERT INTO student_invoice_links(student_id,billing_invoice_id,linked_by) VALUES(1,?,1)',['RCPT-STUDENT']);$link=$db->insert_id;$source=$proof();
        ac_query($db,"INSERT INTO student_payment_submissions(invoice_link_id,student_id,amount,transfer_date,reference,proof_file,request_key) VALUES(?,1,'1000.25','2026-11-14','source-transfer',?,?)",[$link,basename($source),bin2hex(random_bytes(16))]);$submission=(int)$db->insert_id;
        $sourceBefore=ac_one($db,'SELECT * FROM student_payment_submissions WHERE id=?',[$submission]);
        $studentVerify=['action'=>'verify_payment','invoice_id'=>'RCPT-STUDENT','submission_id'=>$submission,'request_id'=>bin2hex(random_bytes(16))];$res=$post($studentVerify);$studentId=$res['json']['data']['payment_id'];
        billing_check($res['code']===200 && $studentId>0 && $res['json']['data']['payment_status']==='Verified','Finance verifies exact persisted student submission through explicit billing source binding');
        billing_check(ac_one($db,'SELECT * FROM student_payment_submissions WHERE id=?',[$submission])===$sourceBefore,'Student proof and accounting review state are preserved; no fictitious posted approval');
        $studentVerify['request_id']=bin2hex(random_bytes(16));$res=$post($studentVerify);
        billing_check($res['json']['data']['payment_id']===$studentId && (int)ac_one($db,"SELECT COUNT(*) AS n FROM billing_pembayaran WHERE noInv='RCPT-STUDENT'")['n']===1,'Submission replay resolves its exact payment without another INSERT');
        $invoice('RCPT-EXISTING-PROOF');ac_query($db,'INSERT INTO student_invoice_links(student_id,billing_invoice_id,linked_by) VALUES(1,?,1)',['RCPT-EXISTING-PROOF']);$link=$db->insert_id;$sameProof=$proof();$existingId=$pending('RCPT-EXISTING-PROOF','1000.25',$sameProof);
        ac_query($db,"INSERT INTO student_payment_submissions(invoice_link_id,student_id,amount,transfer_date,reference,proof_file,request_key) VALUES(?,1,'1000.25','2026-11-14','existing-evidence',?,?)",[$link,basename($sameProof),bin2hex(random_bytes(16))]);$existingSubmission=(int)$db->insert_id;
        $res=$post(['action'=>'verify_payment','invoice_id'=>'RCPT-EXISTING-PROOF','submission_id'=>$existingSubmission,'request_id'=>bin2hex(random_bytes(16))]);
        billing_check($res['code']===200 && $res['json']['data']['payment_id']===$existingId && (int)ac_one($db,"SELECT COUNT(*) AS n FROM billing_pembayaran WHERE noInv='RCPT-EXISTING-PROOF'")['n']===1,'Student proof already backed by one matching pending payment reuses that payment');
        $h=receipt_mail_history($db,$existingId);
        // Match the exact shared helper's 64-character name.
        $lock=substr('receipt-email:'.hash('sha256',(string)$existingId),0,64);ac_query($db,'SELECT GET_LOCK(?,0)',[$lock]);$before=$count();
        try{$res=$post($email($existingId,$h[0]['id']));}finally{ac_query($db,'SELECT RELEASE_LOCK(?)',[$lock]);}
        billing_check($res['code']===409 && $count()===$before,'Receipt email advisory lock blocks concurrent submissions of the same receipt');
        $uncertainHistory=receipt_mail_history($db,$uncertain);$before=$count();
        billing_check($post($email($uncertain,$uncertainHistory[0]['id']))['code']===409 && $count()===$before,'Uncertain receipt SMTP blocks a newly keyed resend');
        $spoof=$send('automation_status.php',['secret'=>$database,'action'=>'mark_receipt_delivery','invoice_id'=>'RCPT-FULL','stage'=>' RECEIPT_EMAIL ','kanal'=>'Email','statusKirim'=>'SMTP Accepted']);
        billing_check($spoof['code']===422,'n8n callbacks cannot create PHP receipt SMTP acceptance evidence');
        $invoice('RCPT-AUDIT');$auditId=$pending('RCPT-AUDIT');$before=$count();
        $db->query("CREATE TRIGGER receipt_audit_fail BEFORE INSERT ON accounting_audit_logs FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='fixture audit fail'");
        try{$res=$post($verify($auditId,'RCPT-AUDIT'));}finally{$db->query('DROP TRIGGER receipt_audit_fail');}
        billing_check($res['code']===500 && !bp_verified(ac_one($db,'SELECT * FROM billing_pembayaran WHERE id=?',[$auditId])) && $count()===$before,'Audit failure rolls back Verify before PDF/SMTP');
        $read=$send('billing.php',null,$cookie);
        billing_check($read['code']===200 && count($read['json']['data']['student_submissions'])===2,'Finance GET exposes actual student proof source and mapped payment');
        $stages=ac_rows($db,"SELECT stage,detail_json FROM automation_logs WHERE invoice_id='RCPT-PARTIAL'");
        billing_check(count($stages)>=3 && count(array_filter($stages,fn($r)=>$r['stage']==='receipt_email'))===count($stages),'Receipt attempts remain distinct from M3.1 invoice email history');
        $ledgerDatabase=$database.'_receipt_ledger';
        $db->query("CREATE DATABASE `$ledgerDatabase`");
        try {
            $db->select_db($ledgerDatabase);
            $db->query('CREATE TABLE accounting_source_documents(id INT PRIMARY KEY,source_type VARCHAR(40),source_id VARCHAR(100)) ENGINE=InnoDB');
            $db->query('CREATE TABLE accounting_transactions(id INT PRIMARY KEY,source_type VARCHAR(40),source_id VARCHAR(100)) ENGINE=InnoDB');
            $db->query('CREATE TABLE payment_allocations(id INT PRIMARY KEY,transaction_id INT,source_document_id INT,amount DECIMAL(15,2),is_reversed TINYINT) ENGINE=InnoDB');
            $db->query('CREATE TABLE billing_pembayaran(id INT PRIMARY KEY,noInv VARCHAR(50),jumlah DECIMAL(15,2),statusVerif VARCHAR(50)) ENGINE=InnoDB');
            $db->query("INSERT INTO accounting_source_documents VALUES(1,'billing_invoice','LEDGER-TEST')");
            $db->query("INSERT INTO accounting_transactions VALUES(1,'manual','unresolved')");
            $db->query("INSERT INTO payment_allocations VALUES(1,1,1,'100.25',0)");
            $blocked=false;try{bp_check_ledger($db,'LEDGER-TEST');}catch(AccountingException $error){$blocked=$error->getCode()===409;}
            billing_check($blocked,'Unresolved ledger allocation prevents duplicate billing recognition');
            $db->query("INSERT INTO billing_pembayaran VALUES(7,'LEDGER-TEST','100.25','Terverifikasi')");
            $db->query("UPDATE accounting_transactions SET source_type='billing_payment',source_id='7'");
            bp_check_ledger($db,'LEDGER-TEST');
            billing_check(true,'Proven existing ledger-to-billing payment link permits a later distinct payment');
        } finally { $db->select_db($database);$db->query("DROP DATABASE `$ledgerDatabase`"); }
        echo 'PASS: '.($GLOBALS['checks']-$start)." M3.2 receipt/payment local integration checks. No external SMTP or n8n calls.\n";
    } finally {
        foreach($files as $file)if(is_file($file))unlink($file);
        // Explicitly owned random-database fixture subdirectories only.
        foreach(['receipt_pdfs','student_payments'] as $folder){$path=$root.'/'.$folder;if(is_dir($path)){foreach(glob($path.'/*') as $file)if(is_file($file))unlink($file);rmdir($path);}}
        if(is_dir($root))rmdir($root);
        putenv($oldRoot===false?'CREATIVA_PRIVATE_UPLOAD_DIR':'CREATIVA_PRIVATE_UPLOAD_DIR='.$oldRoot);
        $write();
    }
}
