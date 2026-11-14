<?php
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require_once __DIR__.'/../services/billing_receipts.php';
require_once __DIR__.'/../services/student_billing.php';
$checks=0;
function receipt_status_check(bool $ok,string $message):void{
 if(!$ok)throw new RuntimeException($message);$GLOBALS['checks']++;echo "PASS: $message\n";
}
receipt_status_check(bp_email_status(null)==='Not Attempted','No persisted attempt is Not Attempted');
foreach(['Pending','Failed','SMTP Accepted'] as $status)receipt_status_check(bp_email_status(['status'=>$status])===$status,'Persisted '.$status.' remains '.$status);
receipt_status_check(bp_email_status(['status'=>'Failed','delivery_uncertain'=>true])==='Failed','Uncertainty does not overwrite the persisted failure status');
receipt_status_check(bp_email_status(null,false)===null,'Unavailable history does not invent Pending or absence');
// An unconnected mysqli handle exercises the actual exception branch without any database access.
$result=bp_complete(new mysqli(),['id'=>1],['receipt'=>['payment_id'=>1,'invoice_id'=>'FOCUSED-STATUS','receipt_number'=>'RCT-2611-0001','invoice_status'=>'Partially Paid','paid_total'=>'1.00','remaining'=>'1.00'],'verified_now'=>false,'replayed'=>true],false);
receipt_status_check($result['email_status']===null && $result['email']['history_available']===false,'bp_complete reports unavailable history honestly after an exception');
receipt_status_check($result['payment_status']==='Verified' && $result['receipt_status']==='Available','Email history failure preserves verified payment and receipt availability');
$submission=['id'=>5,'invoice_link_id'=>7,'student_id'=>11,'status'=>'pending'];
$link=['id'=>7,'student_id'=>11,'billing_invoice_id'=>'INV-1'];
$mapping=['operation'=>'billing_submission','payload_hash'=>hash('sha256',json_encode(['submission_id'=>5,'invoice_id'=>'INV-1'],JSON_THROW_ON_ERROR)),'result_json'=>'{"payment_id":23}'];
$payment=['id'=>23,'noInv'=>'INV-1','statusVerif'=>'Terverifikasi'];
$status=sb_submission_status($submission,$link,$mapping,$payment,11);
receipt_status_check($status['billing_verification']==='Verified' && $status['accounting_review']==='Pending','Billing Verified and Accounting Pending stay separate');
$pending=array_replace($payment,['statusVerif'=>'Menunggu']);
receipt_status_check(sb_submission_status($submission,$link,$mapping,$pending,11)['billing_verification']==='Pending','Known pending billing payment remains Pending');
receipt_status_check(sb_submission_status($submission,$link,null,null,11)['billing_verification']==='Needs Reconciliation','Missing mapping requires reconciliation');
foreach([
 [array_replace($link,['student_id'=>12]),$mapping,$payment,12],
 [$link,$mapping,$payment,12],
 [$link,$mapping,array_replace($payment,['noInv'=>'OTHER-STUDENT-INVOICE']),11],
 [null,$mapping,$payment,11],
 [$link,array_replace($mapping,['payload_hash'=>str_repeat('0',64)]),$payment,11],
 [$link,array_replace($mapping,['result_json'=>'{"payment_id":99}']),$payment,11],
] as [$testLink,$testMapping,$testPayment,$owner]){
 $status=sb_submission_status($submission,$testLink,$testMapping,$testPayment,$owner);
 receipt_status_check($status['billing_verification']==='Needs Reconciliation' && $status['billing_payment_id']===null,'Conflicting or out-of-scope mapping exposes no payment identity');
}
foreach(['accepted'=>'Accepted','rejected'=>'Rejected'] as $raw=>$label)receipt_status_check(sb_submission_status(array_replace($submission,['status'=>$raw]),$link,$mapping,$payment,11)['accounting_review']===$label,'Accounting '.$label.' is preserved independently');
echo "PASS: $checks focused read-only receipt/student status checks. No database connection, SMTP or PDF worker.\n";
