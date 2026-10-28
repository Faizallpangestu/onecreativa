<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private, max-age=0');
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../config/session.php';
require_once __DIR__.'/../services/accounting_reports.php';
require_once __DIR__.'/../services/budget_realization.php';
require_once __DIR__.'/../services/accounting_vendor.php';
mysqli_report(MYSQLI_REPORT_ERROR|MYSQLI_REPORT_STRICT);
$requestId=bin2hex(random_bytes(8));header('X-Request-ID: '.$requestId);
try{
    $actor=session_actor($conn);if(!$actor)ac_fail('Silakan login kembali.',401);ac_require($conn,$actor,'read');ac_ready($conn);
    $csrf=$_SESSION['csrf_token']??'';$permissions=[];foreach(['read','prepare','approve','post','configure']as $p)$permissions[$p]=ac_can($conn,$actor,$p);
    $permissions['configure_roles']=$permissions['configure']&&$actor['role']==='super_admin';
    if($_SERVER['REQUEST_METHOD']==='GET'){
        session_write_close();$view=$_GET['view']??'ledger';
        if($view==='lookups'){
            $departments=ac_table($conn,'departments')?ac_rows($conn,'SELECT id,name FROM departments ORDER BY name'):[];
            $students=ac_table($conn,'peserta_intensif')?ac_rows($conn,'SELECT id,nama_lengkap AS name,batch,no_wa,email,level,nis,affiliator,alamat,kota,provinsi,kode_pos,negara,program,status FROM peserta_intensif ORDER BY id DESC'):[];
            $data=['accounts'=>ac_rows($conn,'SELECT * FROM accounts ORDER BY code'),'banks'=>ac_rows($conn,'SELECT b.*,a.code FROM cash_bank_accounts b JOIN accounts a ON a.id=b.account_id ORDER BY b.name'),'periods'=>ac_rows($conn,'SELECT * FROM accounting_periods ORDER BY month DESC'),'vendors'=>ac_rows($conn,'SELECT * FROM vendors ORDER BY name'),'departments'=>$departments,'students'=>$students,'classifications'=>ac_classifications(),'documents'=>ac_rows($conn,'SELECT d.*,CAST(d.amount-COALESCE((SELECT SUM(p.amount) FROM payment_allocations p WHERE p.source_document_id=d.id AND p.is_reversed=0),0) AS CHAR) AS outstanding FROM accounting_source_documents d ORDER BY d.id DESC')];
            if($permissions['configure'])$data['role_permissions']=ac_rows($conn,'SELECT * FROM finance_role_permissions ORDER BY role_name,permission');
            $data['vendor_bills']=ac_rows($conn,'SELECT b.*,v.name AS vendor_name FROM vendor_bills b JOIN vendors v ON v.id=b.vendor_id ORDER BY b.id DESC');
            foreach($data['documents']as &$doc)$doc['dimensions']=ac_one($conn,'SELECT department_id,batch,student_id,vendor_id FROM journal_lines WHERE journal_entry_id=? AND account_id=? ORDER BY id LIMIT 1',[(int)$doc['journal_entry_id'],(int)$doc['control_account_id']]);unset($doc);
            $data['sources']=[];
            $sourceQueries=[
                'invoice_payment'=>['invoice_records',"SELECT p.id,CONCAT('PAY-',p.id) AS number,p.jumlah AS amount,c.name AS party_name,DATE(p.created_at) AS transaction_date FROM invoice_records p JOIN invoice_clients c ON c.id=p.client_id WHERE NOT EXISTS(SELECT 1 FROM accounting_transactions t WHERE t.source_type='invoice_payment' AND t.source_id=CAST(p.id AS CHAR)) ORDER BY p.id DESC"],
                'billing_payment'=>['billing_pembayaran',"SELECT p.id,CONCAT('PAY-',p.id) AS number,p.jumlah AS amount,p.customer AS party_name,DATE(p.tglBayar) AS transaction_date FROM billing_pembayaran p WHERE NOT EXISTS(SELECT 1 FROM accounting_transactions t WHERE t.source_type='billing_payment' AND t.source_id=CAST(p.id AS CHAR)) ORDER BY p.id DESC"],
                'billing_invoice'=>['billing_invoices','SELECT id,id AS number,total AS amount,customer AS party_name,status FROM billing_invoices ORDER BY id DESC'],
                'invoice_client'=>['invoice_clients',"SELECT id,CONCAT('CLIENT-',id) AS number,total_biaya AS amount,name AS party_name FROM invoice_clients ORDER BY id DESC"],
                'salary'=>['salary_requests',"SELECT id,CONCAT('PAYROLL-',id) AS number,total_salary AS amount,paid_date,employee_name AS party_name,status FROM salary_requests WHERE status IN ('approved','paid') ORDER BY id DESC"],
                'reimbursement'=>['reimbursements',"SELECT r.id,CONCAT('REIMB-',r.id) AS number,r.amount,COALESCE(e.full_name,u.email) AS party_name,r.status FROM reimbursements r LEFT JOIN users u ON u.id=r.user_id LEFT JOIN employees e ON e.user_id=u.id WHERE r.status='approved' ORDER BY r.id DESC"],
                'vendor_bill'=>['vendor_bills',"SELECT b.id,b.number,b.amount,v.name AS party_name,b.status FROM vendor_bills b JOIN vendors v ON v.id=b.vendor_id WHERE b.status='approved' ORDER BY b.id DESC"],
                'asset'=>['assets','SELECT id,asset_code AS number,purchase_price AS amount,name AS party_name FROM assets ORDER BY id DESC'],
                'legacy_finance'=>['finance_records',"SELECT f.id,CONCAT('FIN-',f.id) AS number,f.amount,f.description AS party_name,f.transaction_date FROM finance_records f LEFT JOIN accounting_transactions t ON t.legacy_finance_id=f.id WHERE t.id IS NULL AND f.budget_request_id IS NULL ORDER BY f.id DESC"]
            ];
            foreach($sourceQueries as $type=>[$table,$sql])if(ac_table($conn,$table))$data['sources'][$type]=ac_rows($conn,$sql);
        }elseif($view==='detail')$data=ac_transaction_detail($conn,(string)($_GET['id']??''));
        elseif($view==='journal')$data=ac_journal_detail($conn,ac_id($_GET['id']??null));
        elseif($view==='reports')$data=ac_reports($conn,$_GET);
        elseif($view==='budget')$data=budget_read($conn,ac_id($_GET['id']??null));
        elseif($view==='source')$data=ac_source($conn,ac_text($_GET['source_type']??'','Sumber',40),ac_text((string)($_GET['id']??''),'ID sumber',100));
        elseif($view==='proof'){
            $t=ac_one($conn,'SELECT attachment_key,attachment_name FROM accounting_transactions WHERE id=?',[ac_id($_GET['id']??null)]);$key=$t['attachment_key']??'';if(!preg_match('/^[a-f0-9]{32}$/D',$key))ac_fail('Bukti tidak ditemukan.',404);$path=ac_proof_dir().'/'.$key.'.bin';if(!is_file($path))ac_fail('Bukti tidak ditemukan.',404);header('Content-Type: '.(new finfo(FILEINFO_MIME_TYPE))->file($path));header('X-Content-Type-Options: nosniff');header('Content-Disposition: inline; filename="proof"');readfile($path);exit;
        }elseif($view==='export'){
            $data=ac_ledger($conn,$_GET,true);header('Content-Type: text/csv; charset=utf-8');header('Content-Disposition: attachment; filename="buku-transaksi.csv"');$output=fopen('php://output','w');fwrite($output,"\xEF\xBB\xBF");$columns=['ledger_id','number','transaction_date','type','classification','source_type','source_id','source_number','category','account_code','account_name','department_name','batch','student_id','vendor_id','party_name','description','incoming_amount','outgoing_amount','amount','currency','cash_account_name','approval_status','payment_status','journal_status','created_by','created_by_name','approved_by_name','journal_entry_id','needs_review'];fputcsv($output,$columns);
            foreach($data['rows']as $row){$values=[];foreach($columns as $c){$v=(string)($row[$c]??'');if(!in_array($c,['amount','incoming_amount','outgoing_amount'],true)&&preg_match('/^[=+@\-\t\r]/',$v))$v="'".$v;$values[]=$v;}fputcsv($output,$values);}fclose($output);exit;
        }elseif($view==='export_data')$data=ac_ledger($conn,$_GET,true);
        elseif($view==='ledger')$data=ac_ledger($conn,$_GET);
        else ac_fail('View tidak dikenal.',400);
    }elseif($_SERVER['REQUEST_METHOD']==='POST'){
        if(!$csrf||!hash_equals($csrf,$_SERVER['HTTP_X_CSRF_TOKEN']??''))ac_fail('Token sesi tidak valid. Muat ulang halaman.',403);session_write_close();
        $multipart=str_contains($_SERVER['CONTENT_TYPE']??'','multipart/form-data');$body=json_decode($multipart?($_POST['payload']??''):file_get_contents('php://input'),true,512,JSON_THROW_ON_ERROR);if(!is_array($body)||array_is_list($body))ac_fail('Payload harus object.',400);
        $action=$body['action']??'';
        if(in_array($action,['create','update'],true))$data=ac_transaction_create($conn,$actor,$body,$_FILES['proof']??null);
        elseif($action==='realize')$data=ac_budget_realize($conn,$actor,$body,$_FILES['proof']??null);
        elseif(in_array($action,['vendor_bill','approve_bill'],true))$data=ac_vendor_bill($conn,$actor,$body);
        elseif($action==='recognize')$data=ac_recognize($conn,$actor,$body);
        elseif($action==='recognize_revenue')$data=ac_revenue_release($conn,$actor,$body);
        elseif(in_array($action,['account','bank','period','permission','vendor'],true))$data=ac_master_mutate($conn,$actor,$body);
        elseif($action==='adjustment'){
            ac_require($conn,$actor,'post');$key=ac_key($body['request_key']??'');
            $data=ac_atomic($conn,function()use($conn,$actor,$body,$key){$retry=ac_retry($conn,$actor,$key,'adjustment',$body);if($retry)return $retry;if(!is_array($body['lines']??null))ac_fail('Baris jurnal wajib diisi.');$result=ac_post($conn,$actor,ac_date($body['date']??''),'adjustment',$key,'adjustment',ac_text($body['description']??'','Dokumen/alasan adjustment',2000),$body['lines']);ac_remember($conn,$actor,$key,'adjustment',$body,$result);return $result;});
        }elseif($action==='reverse_journal'){
            ac_require($conn,$actor,'post');$data=ac_atomic($conn,fn()=>ac_reverse($conn,$actor,ac_id($body['id']??null),ac_date($body['date']??''),ac_text($body['note']??'','Alasan reversal',2000)));
        }else $data=ac_transaction_action($conn,$actor,$body);
    }else ac_fail('Method not allowed',405);
    echo json_encode(['status'=>'success','data'=>$data,'permissions'=>$permissions,'csrf_token'=>$csrf,'actor_id'=>(int)$actor['id'],'request_id'=>$requestId],JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE);
}catch(AccountingException|BudgetWorkflowException $e){http_response_code($e->getCode()?:422);echo json_encode(['status'=>'error','message'=>$e->getMessage(),'request_id'=>$requestId]);}
catch(JsonException $e){http_response_code(400);echo json_encode(['status'=>'error','message'=>'JSON tidak valid.','request_id'=>$requestId]);}
catch(Throwable $e){error_log('Accounting request '.$requestId.': '.get_class($e).' '.$e->getMessage());http_response_code(500);echo json_encode(['status'=>'error','message'=>'Proses gagal. Simpan ID permintaan dan hubungi administrator. Retry pembayaran menggunakan key yang sama.','request_id'=>$requestId]);}
