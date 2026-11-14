<?php
require_once __DIR__.'/invoice_mail.php';

function bp_verified(array $payment): bool {
    return in_array(strtolower(trim((string)$payment['statusVerif'])), ['terverifikasi','verified'], true);
}

function bp_paid(mysqli $db, string $invoiceId, bool $lock = false): int {
    $paid = 0;
    foreach (ac_rows($db, 'SELECT * FROM billing_pembayaran WHERE noInv=?'.($lock?' FOR UPDATE':''), [$invoiceId]) as $row) {
        if (bp_verified($row)) $paid = ac_add($paid, ac_cents((string)$row['jumlah']));
    }
    return $paid;
}

function receipt_snapshot(mysqli $db, int $paymentId, ?string $invoiceId = null): array {
    $payment = ac_one($db, 'SELECT * FROM billing_pembayaran WHERE id=?', [$paymentId]);
    if (!$payment) ac_fail('Pembayaran tidak ditemukan.',404);
    if ($invoiceId !== null && $payment['noInv'] !== $invoiceId) ac_fail('Pembayaran bukan milik invoice ini.',409);
    if (!bp_verified($payment)) ac_fail('Receipt hanya tersedia untuk pembayaran tersimpan yang terverifikasi.',409);
    $invoice = ac_one($db,'SELECT * FROM billing_invoices WHERE id=?',[$payment['noInv']]);
    if (!$invoice) ac_fail('Invoice pembayaran tidak ditemukan.',404);
    $amount = ac_cents((string)$payment['jumlah']); $total = ac_cents((string)$invoice['total']);
    if ($amount <= 0 || $amount > $total) ac_fail('Nominal pembayaran perlu rekonsiliasi Finance.',409);
    $date = ac_date($payment['tglBayar']);
    $snapshot = null;
    foreach (ac_rows($db,"SELECT details_json FROM accounting_audit_logs WHERE entity_type='billing_payment' AND entity_id=? AND action IN ('verified','receipt_snapshot') ORDER BY id DESC",[(string)$paymentId]) as $audit) {
        $detail = json_decode($audit['details_json'],true);
        if (isset($detail['receipt'])) { $snapshot=$detail['receipt']; break; }
    }
    if ($snapshot) {
        if (($snapshot['payment_id'] ?? null) !== $paymentId || ($snapshot['receipt_number'] ?? '') !== rpa_format_receipt_number($paymentId,$date)
            || $snapshot['invoice_id'] !== $invoice['id'] || $snapshot['amount'] !== ac_decimal($amount)
            || $snapshot['payment_date'] !== $date || $snapshot['method'] !== $payment['metode']
            || $snapshot['invoice_total'] !== ac_decimal($total)) ac_fail('Snapshot receipt bertentangan dengan pembayaran. Rekonsiliasi diperlukan.',409);
        return $snapshot;
    }
    // Historical verified rows use actual current verified records; never the Paid display fallback.
    return bp_receipt_data($invoice,$payment,bp_paid($db,$invoice['id']));
}

function receipt_prepare(mysqli $db,array $actor,int $paymentId): array {
    $payment=ac_one($db,'SELECT noInv FROM billing_pembayaran WHERE id=?',[$paymentId]);
    if (!$payment) ac_fail('Pembayaran tidak ditemukan.',404);
    return bp_atomic($db,function()use($db,$actor,$paymentId,$payment){
        ac_one($db,'SELECT id FROM billing_invoices WHERE id=? FOR UPDATE',[$payment['noInv']]);
        ac_one($db,'SELECT id FROM billing_pembayaran WHERE id=? FOR UPDATE',[$paymentId]);
        $receipt=receipt_snapshot($db,$paymentId);
        if (!isset($receipt['payment_ids'])) {
            $receipt['payment_ids']=array_map(fn($row)=>(int)$row['id'],ac_rows($db,"SELECT id FROM billing_pembayaran WHERE noInv=? AND LOWER(TRIM(statusVerif)) IN ('verified','terverifikasi') ORDER BY id",[$receipt['invoice_id']]));
            ac_audit($db,$actor,'billing_payment',(string)$paymentId,'receipt_snapshot',['receipt'=>$receipt]);
        }
        return $receipt;
    });
}

function bp_receipt_data(array $invoice, array $payment, int $paid): array {
    $total=ac_cents((string)$invoice['total']);
    if ($paid > $total) ac_fail('Pembayaran melebihi invoice. Rekonsiliasi diperlukan.',409);
    $remaining=$total-$paid;
    return ['payment_id'=>(int)$payment['id'],'invoice_id'=>$invoice['id'],
        'receipt_number'=>rpa_format_receipt_number((int)$payment['id'],ac_date($payment['tglBayar'])),
        'payment_date'=>$payment['tglBayar'],'amount'=>ac_decimal(ac_cents((string)$payment['jumlah'])),
        'method'=>$payment['metode'],'customer'=>$payment['customer'] ?: $invoice['customer'],
        'invoice_total'=>ac_decimal($total),'paid_total'=>ac_decimal($paid),'remaining'=>ac_decimal($remaining),
        'invoice_status'=>$remaining===0?'Paid':'Partially Paid'];
}

function receipt_mail_history(mysqli $db, int $paymentId): array {
    if (!ac_table($db,'automation_logs')) return [];
    return array_map('invoice_mail_attempt',ac_rows($db,"SELECT * FROM automation_logs WHERE stage='receipt_email' AND channel='Email' AND JSON_UNQUOTE(JSON_EXTRACT(detail_json,'$.payment_id'))=? ORDER BY id DESC",[(string)$paymentId]));
}

function receipt_mail_url(array $invoice, array $receipt, array $config): string {
    $invoiceUrl=invoice_mail_url($invoice,$config);
    return substr($invoiceUrl,0,strpos($invoiceUrl,'/invoice_document.php?')).'/receipt_document.php?payment_id='.$receipt['payment_id'].'&token='.rawurlencode($invoice['public_token']);
}

function receipt_pdf_path(array $receipt): string {
    $directory=(getenv('CREATIVA_PRIVATE_UPLOAD_DIR') ?: __DIR__.'/../storage/documents').'/receipt_pdfs';
    $name='receipt-'.$receipt['payment_id'].'-'.hash('sha256',json_encode($receipt,JSON_THROW_ON_ERROR)).'.pdf';
    return $directory.'/'.$name;
}

function receipt_pdf(mysqli $db, array $receipt, ?array $config = null): string {
    $config=$config ?? salary_mail_config();
    $file=receipt_pdf_path($receipt); $directory=dirname($file);
    if (is_file($file)) {
        $pdf=file_get_contents($file);
        if (str_starts_with($pdf,'%PDF-') && str_contains(substr($pdf,-1024),'%%EOF')) return $pdf;
        ac_fail('Arsip PDF receipt tidak valid. Hubungi pengelola server.',409);
    }
    $invoice=ac_one($db,'SELECT * FROM billing_invoices WHERE id=?',[$receipt['invoice_id']]);
    $url=receipt_mail_url($invoice,$receipt,$config);
    $config['invoice_pdf_required']=true;
    $pdf=invoice_mail_pdf($invoice,$url,$config,$receipt);
    if (!is_dir($directory) && !mkdir($directory,0750,true) && !is_dir($directory)) ac_fail('Arsip PDF receipt belum dapat disimpan.',503);
    $temporary=tempnam($directory,'.receipt-');
    if ($temporary===false) ac_fail('Arsip PDF receipt tidak dapat ditulis. Hubungi pengelola server.',503);
    try {
        if (file_put_contents($temporary,$pdf)!==strlen($pdf) || !rename($temporary,$file)) ac_fail('Arsip PDF receipt gagal disimpan.',503);
        chmod($file,0640);
    } finally { if (is_file($temporary)) unlink($temporary); }
    return $pdf;
}

function receipt_mail_content(array $invoice, array $receipt, string $url): array {
    $plain="Yth. {$receipt['customer']},\n\nReceipt resmi {$receipt['receipt_number']}\nInvoice: {$invoice['id']}\nPembayaran #{$receipt['payment_id']}\nTanggal: {$receipt['payment_date']}\nMetode: {$receipt['method']}\nNominal terverifikasi: Rp {$receipt['amount']}\nTotal pembayaran terverifikasi: Rp {$receipt['paid_total']}\nSisa tagihan: Rp {$receipt['remaining']}\nStatus: {$receipt['invoice_status']}\n\nDokumen receipt: $url\n\nFinance Creativa";
    return ['subject'=>'Receipt '.$receipt['receipt_number'].' - Finance Creativa','plain'=>$plain,
        'html'=>'<div style="font-family:Arial,sans-serif;line-height:1.6">'.nl2br(htmlspecialchars($plain,ENT_QUOTES,'UTF-8')).'</div>'];
}

function receipt_mail_send(mysqli $db, array $actor, array $body): array {
    ac_require($db,$actor,'prepare');
    $receipt=receipt_prepare($db,$actor,ac_id($body['payment_id'] ?? null,'ID pembayaran'));
    return finance_document_mail_send($db,$actor,array_replace($body,['invoice_id'=>$receipt['invoice_id']]),$receipt);
}

function bp_proof(array $payment): string {
    $path=(string)($payment['proof_path'] ?? '');
    if (preg_match('#^student_payments/([a-f0-9]{32}\.(?:jpg|png|webp|pdf))$#D',$path,$match)) {
        require_once __DIR__.'/relationships.php'; return rs_document('student_payments',$match[1])[0];
    }
    if (!preg_match('#^payment_proofs/[a-f0-9]{32}\.(?:jpg|png|webp|pdf)$#D',$path)) ac_fail('Bukti pembayaran tersimpan wajib direview.',422);
    $file=__DIR__.'/../uploads/'.$path;
    if (!is_file($file) || is_link($file) || !in_array((new finfo(FILEINFO_MIME_TYPE))->file($file),['image/jpeg','image/png','image/webp','application/pdf'],true)) ac_fail('Bukti pembayaran tidak tersedia atau tidak valid.',422);
    return $file;
}

function bp_submission(mysqli $db, array $actor, int $id, string $invoiceId): int {
    require_once __DIR__.'/student_billing.php';
    $submission=ac_one($db,'SELECT * FROM student_payment_submissions WHERE id=? FOR UPDATE',[$id]);
    if (!$submission) ac_fail('Bukti siswa tidak ditemukan.',404);
    $link=ac_one($db,'SELECT * FROM student_invoice_links WHERE id=?',[(int)$submission['invoice_link_id']]);
    if (!$link || $link['billing_invoice_id'] !== $invoiceId || (int)$link['student_id'] !== (int)$submission['student_id']) ac_fail('Bukti siswa bukan milik invoice ini.',409);
    $owner=sb_billing_owner($db,ac_one($db,'SELECT * FROM billing_invoices WHERE id=?',[$invoiceId]));
    if ($owner===null || $owner!==(int)$submission['student_id']) ac_fail('Pemilik invoice dan bukti siswa perlu rekonsiliasi.',409);
    $sourceKey='billing-submission-'.$id;
    $saved=ac_one($db,'SELECT operation,result_json FROM accounting_idempotency WHERE request_key=?',[$sourceKey]);
    if ($saved) {
        if ($saved['operation']!=='billing_submission') ac_fail('Identitas sumber bukti konflik.',409);
        return ac_id(json_decode($saved['result_json'],true)['payment_id'] ?? null);
    }
    if ($submission['status']!=='pending') ac_fail('Bukti ini sudah direview pada akuntansi. Rekonsiliasi diperlukan sebelum pengakuan billing.',409);
    $proof='student_payments/'.$submission['proof_file']; bp_proof(['proof_path'=>$proof]);
    $existingPayment=bp_duplicate_proof($db,$invoiceId,$proof,null,$submission);
    if ($existingPayment !== null) {
        ac_remember($db,$actor,$sourceKey,'billing_submission',['submission_id'=>$id,'invoice_id'=>$invoiceId],['payment_id'=>$existingPayment]);
        return $existingPayment;
    }
    $invoice=ac_one($db,'SELECT * FROM billing_invoices WHERE id=?',[$invoiceId]);
    ac_query($db,"INSERT INTO billing_pembayaran(noInv,tglBayar,customer,metode,jumlah,sisa,statusVerif,proof_path) VALUES(?,?,?,?,?,?,'Menunggu',?)",[$invoiceId,$submission['transfer_date'],$invoice['customer'],'Transfer Bank',$submission['amount'],$invoice['total'],$proof]);
    $paymentId=(int)$db->insert_id;
    ac_remember($db,$actor,$sourceKey,'billing_submission',['submission_id'=>$id,'invoice_id'=>$invoiceId],['payment_id'=>$paymentId]);
    return $paymentId;
}

function bp_duplicate_proof(mysqli $db,string $invoiceId,?string $proof,?int $except = null,?array $submission = null): ?int {
    if (!$proof) return null;
    $hash=hash_file('sha256',bp_proof(['proof_path'=>$proof]));
    $matches=[];
    foreach (ac_rows($db,'SELECT * FROM billing_pembayaran WHERE noInv=?',[$invoiceId]) as $existing) {
        if ((int)$existing['id']===$except || !$existing['proof_path']) continue;
        try { $file=bp_proof($existing); } catch (AccountingException $error) { continue; }
        if (hash_equals($hash,hash_file('sha256',$file))) $matches[]=$existing;
    }
    if (!$matches) return null;
    $existing=$matches[0];
    if ($submission && count($matches)===1 && in_array(strtolower(trim($existing['statusVerif'])),['menunggu','pending'],true)
        && ac_cents($existing['jumlah'])===ac_cents($submission['amount']) && $existing['tglBayar']===$submission['transfer_date']) return (int)$existing['id'];
    ac_fail('Bukti yang sama sudah terhubung ke pembayaran lain. Gunakan pembayaran existing atau rekonsiliasi Finance.',409);
}

function bp_check_ledger(mysqli $db,string $invoiceId): void {
    if (!ac_table($db,'payment_allocations')) return;
    $allocations=ac_rows($db,"SELECT pa.amount,t.source_type,t.source_id FROM payment_allocations pa JOIN accounting_source_documents d ON d.id=pa.source_document_id JOIN accounting_transactions t ON t.id=pa.transaction_id WHERE d.source_type='billing_invoice' AND d.source_id=? AND pa.is_reversed=0",[$invoiceId]);
    foreach ($allocations as $allocation) {
        $known=$allocation['source_type']==='billing_payment' ? ac_one($db,'SELECT * FROM billing_pembayaran WHERE id=? AND noInv=?',[$allocation['source_id'],$invoiceId]) : null;
        if (!$known || !bp_verified($known) || ac_cents($known['jumlah'])!==ac_cents($allocation['amount'])) {
            ac_fail('Alokasi akuntansi existing belum terhubung pasti ke pembayaran billing. Rekonsiliasi diperlukan agar tidak diakui dua kali.',409);
        }
    }
}

function bp_atomic(mysqli $db,callable $operation): array {
    // ac_atomic rolls back first. Retry only database work, never PDF/SMTP.
    for ($attempt=0;$attempt<3;$attempt++) {
        try { return ac_atomic($db,$operation); }
        catch (mysqli_sql_exception $error) {
            if ($error->getCode()===1213 && $attempt<2) continue;
            if (in_array($error->getCode(),[1213,1062],true)) ac_fail('Verifikasi mengalami konflik sementara atau request key sudah dipakai. Periksa hasil server dengan request yang sama.',409);
            throw $error;
        }
    }
}

function bp_verify(mysqli $db, array $actor, array $body, bool $manual = false, ?string $proof = null): array {
    ac_require($db,$actor,'prepare');
    if (!ac_table($db,'accounting_idempotency')) ac_fail('Skema idempotency akuntansi existing belum tersedia.',409);
    $key=ac_key($body['request_id'] ?? null);
    $invoiceId=ac_text($body['invoice_id'] ?? null,'Nomor invoice',50);
    $payload=['invoice_id'=>$invoiceId,'payment_id'=>$body['payment_id'] ?? null,'submission_id'=>$body['submission_id'] ?? null];
    if ($manual) $payload+=['amount'=>ac_decimal(ac_cents($body['jumlah'] ?? null)),'date'=>ac_date($body['tglBayar'] ?? null),'method'=>ac_text($body['metode'] ?? 'Transfer Bank','Metode',50)];
    return bp_atomic($db,function () use ($db,$actor,$body,$manual,$proof,$key,$invoiceId,$payload) {
        $operation=$manual?'billing_manual_payment':'billing_verify_payment';
        $retry=ac_retry($db,$actor,$key,$operation,$payload);
        if ($retry) return array_replace($retry,['verified_now'=>false,'replayed'=>true]);
        $invoice=ac_one($db,'SELECT * FROM billing_invoices WHERE id=? FOR UPDATE',[$invoiceId]);
        if (!$invoice) ac_fail('Invoice tidak ditemukan.',404);
        $invoiceId=$invoice['id'];
        if (in_array(strtolower(trim($invoice['status'])),['cancelled','canceled','void','draft','batal','dibatalkan'],true)) ac_fail('Invoice tidak memenuhi syarat verifikasi.',409);
        if ($manual) {
            if (isset($body['payment_id']) || isset($body['submission_id'])) ac_fail('Pembayaran manual harus terpisah dari Verify bukti existing.',422);
            $payment=['tglBayar'=>$payload['date'],'jumlah'=>$payload['amount'],'metode'=>$payload['method'],'customer'=>$invoice['customer'],'proof_path'=>$proof];
        } else {
            if (isset($body['payment_id']) === isset($body['submission_id'])) ac_fail('Pilih payment_id atau submission_id sumber bukti.',422);
            $id=isset($body['submission_id'])?bp_submission($db,$actor,ac_id($body['submission_id']),$invoiceId):ac_id($body['payment_id'] ?? null);
            $payment=ac_one($db,'SELECT * FROM billing_pembayaran WHERE id=? FOR UPDATE',[$id]);
            if (!$payment) ac_fail('Pembayaran tidak ditemukan.',404);
            if ($payment['noInv']!==$invoiceId) ac_fail('Pembayaran bukan milik invoice ini.',409);
            if (bp_verified($payment)) {
                $result=['receipt'=>receipt_snapshot($db,$id),'verified_now'=>false,'replayed'=>true];
                ac_remember($db,$actor,$key,$operation,$payload,$result); return $result;
            }
            if (!in_array(strtolower(trim($payment['statusVerif'])),['menunggu','pending'],true)) ac_fail('Pembayaran tidak berstatus pending.',409);
            bp_proof($payment);
        }
        bp_check_ledger($db,$invoiceId);
        bp_duplicate_proof($db,$invoiceId,$payment['proof_path'] ?? null,isset($payment['id'])?(int)$payment['id']:null);
        $paid=bp_paid($db,$invoiceId,true); $total=ac_cents((string)$invoice['total']); $amount=ac_cents((string)$payment['jumlah']);
        if ($paid===0 && in_array(strtolower(trim($invoice['status'])),['paid','lunas'],true)) ac_fail('Invoice Paid tanpa pembayaran terverifikasi perlu rekonsiliasi.',409);
        if ($amount<=0 || $amount>$total-$paid) ac_fail('Nominal pembayaran melebihi sisa tagihan atau tidak valid.',409);
        ac_date($payment['tglBayar']);
        $remaining=$total-ac_add($paid,$amount);
        if ($manual) {
            ac_query($db,"INSERT INTO billing_pembayaran(noInv,tglBayar,customer,metode,jumlah,sisa,statusVerif,proof_path) VALUES(?,?,?,?,?,?,'Terverifikasi',?)",[$invoiceId,$payment['tglBayar'],$invoice['customer'],$payment['metode'],ac_decimal($amount),ac_decimal($remaining),$proof]);
            $payment['id']=(int)$db->insert_id;
        } else ac_query($db,"UPDATE billing_pembayaran SET statusVerif='Terverifikasi',sisa=? WHERE id=?",[ac_decimal($remaining),(int)$payment['id']]);
        $receipt=bp_receipt_data($invoice,$payment,$paid+$amount);
        $receipt['payment_ids']=array_map(fn($row)=>(int)$row['id'],ac_rows($db,"SELECT id FROM billing_pembayaran WHERE noInv=? AND LOWER(TRIM(statusVerif)) IN ('verified','terverifikasi') ORDER BY id",[$invoiceId]));
        ac_query($db,'UPDATE billing_invoices SET status=? WHERE id=?',[$receipt['invoice_status'],$invoiceId]);
        ac_audit($db,$actor,'billing_payment',(string)$payment['id'],'verified',['invoice_id'=>$invoiceId,'amount'=>ac_decimal($amount),'remaining'=>ac_decimal($remaining),'receipt'=>$receipt,'manual'=>$manual]);
        $result=['receipt'=>$receipt,'verified_now'=>true,'replayed'=>false];
        ac_remember($db,$actor,$key,$operation,$payload,$result); return $result;
    });
}

function bp_complete(mysqli $db, array $actor, array $verified, bool $sendEmail = true): array {
    $receipt=$verified['receipt']; $id=(int)$receipt['payment_id'];
    $result=['payment_id'=>$id,'invoice_id'=>$receipt['invoice_id'],'payment_status'=>'Verified','receipt_status'=>'Available',
        'receipt_number'=>$receipt['receipt_number'],'receipt_url'=>'/api/receipt_document.php?payment_id='.$id,
        'receipt_pdf_url'=>'/api/billing.php?view=receipt_pdf&payment_id='.$id,'status'=>$receipt['invoice_status'],
        'invoice_url'=>'/api/invoice_document.php?id='.rawurlencode($receipt['invoice_id']),'status_url'=>'','proof_url'=>'','proof_mime'=>'',
        'terbayar'=>$receipt['paid_total'],'sisa'=>$receipt['remaining'],'verified_now'=>$verified['verified_now'],'replayed'=>$verified['replayed']];
    try {
        $payment=ac_one($db,'SELECT proof_path FROM billing_pembayaran WHERE id=?',[$id]);
        if (!empty($payment['proof_path'])) {
            $result['proof_url']='/api/billing.php?view=payment_proof&id='.$id;
            $result['proof_mime']=['png'=>'image/png','jpg'=>'image/jpeg','webp'=>'image/webp','pdf'=>'application/pdf'][strtolower(pathinfo($payment['proof_path'],PATHINFO_EXTENSION))] ?? '';
        }
        $invoice=ac_one($db,'SELECT * FROM billing_invoices WHERE id=?',[$receipt['invoice_id']]);
        if (!empty($invoice['public_token'])) {
            $urls=rpa_build_public_urls($invoice['id'],$invoice['public_token'],$id);
            foreach (['receipt_url','invoice_url','status_url'] as $field) $result[$field]=$urls[$field];
        }
        $history=receipt_mail_history($db,$id);
        // A verification replay never resends, even when a later explicit email retry has failed.
        $delivery=$history ? ['attempt'=>$history[0],'replayed'=>true] : ($sendEmail ? receipt_mail_send($db,$actor,['payment_id'=>$id,'request_id'=>'receipt-auto-'.$id,'previous_attempt_id'=>null]) : ['attempt'=>null]);
        $result['email_status']=$delivery['attempt']['status'] ?? 'Not Attempted'; $result['email']=$delivery;
    } catch (Throwable $error) {
        try { $history=receipt_mail_history($db,$id); } catch (Throwable $readError) { $history=[]; }
        $result['email_status']=$history[0]['status'] ?? 'Pending';
        $result['email']=['attempt'=>$history[0] ?? null,'message'=>'Pembayaran tetap terverifikasi. Pengiriman receipt belum dapat dikonfirmasi; periksa konfigurasi/riwayat server.'];
    }
    $result['pdf_status']=is_file(receipt_pdf_path($receipt))?'Available':'Not Generated';
    return $result;
}

function bp_submissions(mysqli $db): array {
    if (!ac_table($db,'student_payment_submissions') || !ac_one($db,"SHOW COLUMNS FROM student_payment_submissions LIKE 'invoice_link_id'")) return [];
    $rows=ac_rows($db,"SELECT s.id,s.student_id,s.invoice_link_id,s.amount,s.transfer_date,s.reference,s.status,s.transaction_id,l.billing_invoice_id AS invoice_id,i.customer,i.email FROM student_payment_submissions s JOIN student_invoice_links l ON l.id=s.invoice_link_id JOIN billing_invoices i ON i.id=l.billing_invoice_id ORDER BY s.id DESC");
    foreach ($rows as &$row) {
        $saved=ac_table($db,'accounting_idempotency')?ac_one($db,"SELECT result_json FROM accounting_idempotency WHERE request_key=? AND operation='billing_submission'",['billing-submission-'.$row['id']]):null;
        $row['billing_payment_id']=$saved?(int)json_decode($saved['result_json'],true)['payment_id']:null;
        $row['proof_url']='/api/student_billing.php?view=proof&id='.$row['id'];
    }
    return $rows;
}
