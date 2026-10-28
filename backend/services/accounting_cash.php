<?php
require_once __DIR__.'/accounting_journal.php';
function ac_classifications():array {
    return [
      'direct_revenue'=>['label'=>'Pendapatan langsung','type'=>'income','groups'=>[4],'flow'=>'operating'],
      'owner_capital'=>['label'=>'Setoran modal pemilik','type'=>'income','classes'=>['capital'],'flow'=>'financing'],
      'investor_equity'=>['label'=>'Setoran ekuitas investor','type'=>'income','classes'=>['capital'],'flow'=>'financing'],
      'loan_receipt'=>['label'=>'Penerimaan pinjaman','type'=>'income','classes'=>['loan'],'flow'=>'financing'],
      'invoice_payment'=>['label'=>'Pembayaran invoice / piutang','type'=>'income','classes'=>['receivable'],'flow'=>'operating','documents'=>['billing_invoice','invoice_client']],
      'student_advance'=>['label'=>'Uang muka siswa','type'=>'income','classes'=>['deferred_revenue'],'flow'=>'operating'],
      'operating_expense'=>['label'=>'Beban operasional langsung','type'=>'expense','groups'=>[5],'flow'=>'operating'],
      'vendor_payment'=>['label'=>'Pembayaran vendor','type'=>'expense','classes'=>['payable'],'flow'=>'operating','documents'=>['vendor_bill']],
      'payroll'=>['label'=>'Pembayaran gaji','type'=>'expense','classes'=>['payroll_payable'],'flow'=>'operating','documents'=>['salary']],
      'reimbursement'=>['label'=>'Pembayaran reimbursement','type'=>'expense','classes'=>['reimbursement_payable'],'flow'=>'operating','documents'=>['reimbursement']],
      'asset_purchase'=>['label'=>'Pembelian aset tetap','type'=>'expense','classes'=>['fixed_asset'],'flow'=>'investing'],
      'inventory_purchase'=>['label'=>'Pembelian persediaan','type'=>'expense','classes'=>['inventory'],'flow'=>'operating'],
      'prepayment'=>['label'=>'Uang muka / kasbon','type'=>'expense','classes'=>['prepayment'],'flow'=>'operating'],
      'tax_payment'=>['label'=>'Pembayaran pajak','type'=>'expense','classes'=>['tax_payable','income_tax'],'flow'=>'operating'],
      'loan_repayment'=>['label'=>'Pembayaran pokok pinjaman','type'=>'expense','classes'=>['loan'],'flow'=>'financing'],
      'loan_interest'=>['label'=>'Pembayaran bunga pinjaman','type'=>'expense','classes'=>['other_expense'],'flow'=>'operating'],
      'bank_transfer'=>['label'=>'Transfer antar rekening perusahaan','type'=>'transfer','classes'=>['cash'],'flow'=>'transfer'],
      'other_receipt'=>['label'=>'Penerimaan lain terklasifikasi','type'=>'income','groups'=>[1,2,3,4],'flow'=>null],
      'other_payment'=>['label'=>'Pengeluaran lain terklasifikasi','type'=>'expense','groups'=>[1,2,5],'flow'=>null]
    ];
}
function ac_source(mysqli $db,string $type,string $id,bool $lock=false):array {
    $suffix=$lock?' FOR UPDATE':'';
    $map=[
      'legacy_finance'=>['finance_records','amount','transaction_date','FIN-'],
      'billing_invoice'=>['billing_invoices','total','tanggal',''],
      'invoice_client'=>['invoice_clients','total_biaya','created_at','CLIENT-'],
      'billing_payment'=>['billing_pembayaran','jumlah','tglBayar','PAY-'],
      'invoice_payment'=>['invoice_records','jumlah','created_at','PAY-'],
      'salary'=>['salary_requests','total_salary','period_end','PAYROLL-'],
      'reimbursement'=>['reimbursements','amount','created_at','REIMB-'],
      'asset'=>['assets','purchase_price','purchase_date','ASSET-'],
      'vendor_bill'=>['vendor_bills','amount','bill_date',''],
      'budget_realization'=>['budget_realizations','amount','created_at','REAL-']
    ];
    if(!isset($map[$type]))ac_fail('Jenis dokumen sumber tidak dikenal.');
    [$table,$amount,$date,$prefix]=$map[$type];if(!ac_table($db,$table))ac_fail('Tabel dokumen sumber belum tersedia.',503);
    $row=ac_one($db,"SELECT * FROM $table WHERE id=?$suffix",[$id]);if(!$row)ac_fail('Dokumen sumber tidak ditemukan.',404);
    if($lock&&$type==='billing_invoice'&&in_array(strtolower($row['status']),['cancelled','canceled','dibatalkan','batal'],true))ac_fail('Invoice telah dibatalkan.',409);
    if($lock&&$type==='salary'&&!in_array($row['status'],['approved','paid'],true))ac_fail('Payroll belum disetujui.',409);
    if($lock&&$type==='reimbursement'&&$row['status']!=='approved')ac_fail('Reimbursement belum disetujui.',409);
    if($lock&&$type==='vendor_bill'&&$row['status']!=='approved')ac_fail('Tagihan vendor belum disetujui.',409);
    if($lock&&$type==='budget_realization'&&$row['status']!=='recorded')ac_fail('Realisasi dibatalkan.',409);
    $number=$type==='billing_invoice'?$row['id']:($row['number']??$row['asset_code']??$prefix.$row['id']);
    return ['type'=>$type,'id'=>(string)$row['id'],'number'=>$number,'amount'=>$row[$amount],'date'=>substr($row[$date],0,10),'record'=>$row];
}
function ac_bank(mysqli $db,int $id):array {
    $bank=ac_one($db,'SELECT b.*,a.code,a.report_class FROM cash_bank_accounts b JOIN accounts a ON a.id=b.account_id WHERE b.id=? AND b.is_active=1 AND a.is_active=1 AND a.is_detail=1 FOR UPDATE',[$id]);
    if(!$bank||$bank['report_class']!=='cash')ac_fail('Rekening kas/bank tidak valid.');return $bank;
}
function ac_dims(mysqli $db,array $data):array {
    $department=empty($data['department_id'])?null:ac_id($data['department_id']);
    if($department&&!ac_one($db,'SELECT id FROM departments WHERE id=?',[$department]))ac_fail('Departemen tidak ditemukan.');
    $student=empty($data['student_id'])?null:ac_id($data['student_id']);
    if($student&&!ac_one($db,'SELECT id FROM peserta_intensif WHERE id=?',[$student]))ac_fail('Siswa tidak ditemukan.');
    $vendor=empty($data['vendor_id'])?null:ac_id($data['vendor_id']);
    if($vendor&&!ac_one($db,'SELECT id FROM vendors WHERE id=? AND is_active=1',[$vendor]))ac_fail('Vendor tidak ditemukan.');
    return ['department_id'=>$department,'student_id'=>$student,'vendor_id'=>$vendor,'batch'=>ac_text($data['batch']??'','Batch',100,false),'party_name'=>ac_text($data['party_name']??'','Pihak terkait',255)];
}
function ac_transaction_create(mysqli $db,array $actor,array $data,?array $upload=null,bool $inside=false):array {
    ac_require($db,$actor,'prepare');$key=ac_key($data['request_key']??'');
    $newProof=null;
    $work=function()use($db,$actor,$data,$key,$upload,&$newProof){
        $operation=($data['action']??'')==='update'?'transaction_update':'transaction_create';
        $retry=ac_retry($db,$actor,$key,$operation,$data);if($retry)return $retry;
        $editing=null;if($operation==='transaction_update'){$editing=ac_one($db,'SELECT * FROM accounting_transactions WHERE id=? FOR UPDATE',[ac_id($data['id']??null)]);if(!$editing||(int)$editing['created_by']!==(int)$actor['id']||$editing['approval_status']!=='draft'||$editing['payment_status']!=='unpaid'||$editing['journal_status']!=='unposted')ac_fail('Hanya pembuat dapat mengedit draft yang belum dibayar.',409);if(($data['source_type']??'cash_transaction')!==$editing['source_type']||($editing['source_type']!=='cash_transaction'&&(string)($data['source_id']??'')!==$editing['source_id']))ac_fail('Dokumen sumber tidak boleh diganti; batalkan dan buat draft baru.',409);}
        $class=$data['classification']??'';$rule=ac_classifications()[$class]??null;if(!$rule)ac_fail('Klasifikasi transaksi wajib dipilih.');
        $date=ac_date($data['transaction_date']??'');$amount=ac_cents($data['amount']??'');if(!$amount)ac_fail('Nominal harus lebih dari nol.');
        $bank=ac_bank($db,ac_id($data['cash_account_id']??null,'Rekening kas/bank'));
        $counter=ac_account($db,ac_id($data['counter_account_id']??null,'COA'));$destination=null;
        if(isset($rule['groups'])&&!in_array((int)$counter['account_group'],$rule['groups'],true))ac_fail('Kelompok COA tidak sesuai jenis transaksi.');
        if(isset($rule['classes'])&&!in_array($counter['report_class'],$rule['classes'],true))ac_fail('COA tidak sesuai substansi transaksi.');
        if($counter['id']===$bank['account_id']&&$class!=='bank_transfer')ac_fail('Akun lawan tidak boleh sama dengan kas/bank.');
        if($class==='bank_transfer'){$dest=ac_bank($db,ac_id($data['destination_cash_account_id']??null,'Rekening tujuan'));if($dest['id']===$bank['id'])ac_fail('Rekening sumber dan tujuan harus berbeda.');$destination=(int)$dest['id'];$counter=ac_account($db,(int)$dest['account_id']);}
        $sourceType=ac_text($data['source_type']??'cash_transaction','Jenis sumber',40);
        $sourceId=$sourceType==='cash_transaction'?'0':ac_text((string)($data['source_id']??''),'ID sumber',100);
        $legacy=null;$sourceNumber='';$source=null;$dimensionData=$data;
        if($sourceType!=='cash_transaction'){
            $source=ac_source($db,$sourceType,$sourceId,true);$sourceNumber=$source['number'];
            $sourceClass=['billing_invoice'=>'invoice_payment','invoice_client'=>'invoice_payment','invoice_payment'=>'invoice_payment','billing_payment'=>'invoice_payment','vendor_bill'=>'vendor_payment','salary'=>'payroll','reimbursement'=>'reimbursement','asset'=>'asset_purchase'];if(isset($sourceClass[$sourceType])&&$class!==$sourceClass[$sourceType])ac_fail('Substansi transaksi tidak sesuai dokumen sumber.');
            if($sourceType==='legacy_finance'){$legacy=(int)$sourceId;if(!empty($source['record']['budget_request_id']))ac_fail('Approval RAB lama bukan penerimaan kas; review dokumen pendanaan terpisah.',409);
                if(!empty($source['record']['salary_request_id'])&&$class!=='payroll')ac_fail('Pembayaran payroll historis harus settlement utang gaji.');
                if($amount!==ac_cents($source['amount'])||$date!==$source['date']||$rule['type']!==$source['record']['type'])ac_fail('Nominal/tanggal/arah harus sesuai transaksi historis.');}
            if(in_array($sourceType,['salary','reimbursement','asset','budget_realization','invoice_payment','billing_payment'],true)&&$amount!==ac_cents($source['amount']))ac_fail('Nominal harus sesuai dokumen sumber.');
            if(in_array($sourceType,['invoice_payment','billing_payment'],true)&&($class!=='invoice_payment'||$date!==$source['date']))ac_fail('Pembayaran historis harus settlement piutang pada tanggal aslinya.');
            if($sourceType==='salary'&&$class!=='payroll')ac_fail('Payroll hanya boleh settlement utang gaji.');
            if($sourceType==='reimbursement'&&$class!=='reimbursement')ac_fail('Klaim hanya boleh settlement reimbursement.');
            if($sourceType==='salary'){$f=ac_one($db,'SELECT id FROM finance_records WHERE salary_request_id=?',[(int)$sourceId]);if(!$f||$source['record']['status']!=='paid')ac_fail('Bayarkan payroll melalui workflow Salary, lalu review pembayaran ini untuk jurnal.',409);$legacy=(int)$f['id'];if($date!==$source['record']['paid_date'])ac_fail('Tanggal harus sama dengan pembayaran payroll.');}
            if(in_array($sourceType,['salary','reimbursement','asset','budget_realization','invoice_payment','billing_payment'],true)&&ac_one($db,"SELECT id FROM accounting_transactions WHERE source_type=? AND source_id=? AND id<>? AND approval_status<>'cancelled' AND journal_status<>'reversed' LIMIT 1",[$sourceType,$sourceId,(int)($editing['id']??0)]))ac_fail('Dokumen pembayaran sudah memiliki transaksi aktif.',409);
        }
        if(!empty($rule['documents'])){
            $docType=$sourceType;$docId=$sourceId;
            if($sourceType==='invoice_payment'){$docType='invoice_client';$docId=(string)$source['record']['client_id'];}
            if($sourceType==='billing_payment'){$docType='billing_invoice';$docId=(string)$source['record']['noInv'];}
            if($sourceType==='legacy_finance'){$docType=ac_text($data['document_type']??'','Dokumen terkait',40);$docId=ac_text((string)($data['document_id']??''),'ID dokumen',100);ac_source($db,$docType,$docId,true);}
            if(!in_array($docType,$rule['documents'],true))ac_fail('Jenis transaksi membutuhkan dokumen sumber yang sesuai.');
            $doc=ac_one($db,'SELECT * FROM accounting_source_documents WHERE source_type=? AND source_id=? FOR UPDATE',[$docType,$docId]);
            if(!$doc)ac_fail('Dokumen belum diakui ke jurnal. Catat pengakuan dahulu.',409);
            if((int)$doc['control_account_id']!==(int)$counter['id'])ac_fail('COA pelunasan harus sama dengan akun kontrol dokumen.');
            $origin=ac_one($db,'SELECT department_id,batch,student_id,vendor_id FROM journal_lines WHERE journal_entry_id=? AND account_id=? ORDER BY id LIMIT 1',[(int)$doc['journal_entry_id'],(int)$doc['control_account_id']]);
            foreach(['department_id','batch','student_id','vendor_id']as $dimension){$value=$origin[$dimension]??null;if(!empty($data[$dimension])&&(string)$data[$dimension]!== (string)$value)ac_fail('Dimensi pembayaran harus sama dengan pengakuan dokumen. Periksa dokumen sumber.',409);$dimensionData[$dimension]=$value;}
        }
        $dim=ac_dims($db,$dimensionData);$description=ac_text($data['description']??'','Deskripsi',2000);
        $method=ac_text($data['payment_method']??'Transfer','Metode pembayaran',50);$reference=ac_text($data['reference']??'','Referensi',180,false);
        $category=ac_text($data['category']??$rule['label'],'Kategori',100);
        $link=ac_text($data['attachment_link']??'','Link bukti',2048,false);
        if($link&&(!filter_var($link,FILTER_VALIDATE_URL)||!in_array(parse_url($link,PHP_URL_SCHEME),['http','https'],true)||parse_url($link,PHP_URL_USER)!==null||parse_url($link,PHP_URL_PASS)!==null))ac_fail('Link bukti harus HTTP(S) tanpa kredensial.');
        if($editing){
            $id=(int)$editing['id'];$number=$editing['number'];
            $bound=ac_one($db,'SELECT * FROM budget_realizations WHERE transaction_id=? FOR UPDATE',[$id]);if($bound&&($amount!==ac_cents($bound['amount'])||$class!==$editing['classification']||$dim['vendor_id']!==(int)$editing['vendor_id']||$dim['department_id']!==(int)$editing['department_id']))ac_fail('Nominal/substansi/vendor/departemen realisasi terkunci. Batalkan draft untuk realisasi baru.',409);
            if($sourceType==='budget_realization'&&($class!==$editing['classification']||$dim['vendor_id']!==(int)$editing['vendor_id']))ac_fail('Substansi/vendor realisasi terkunci. Batalkan draft untuk membuat realisasi baru.',409);
            ac_query($db,'UPDATE accounting_transactions SET transaction_date=?,type=?,classification=?,category=?,description=?,amount=?,cash_account_id=?,destination_cash_account_id=?,counter_account_id=?,department_id=?,batch=?,student_id=?,vendor_id=?,party_name=?,payment_method=?,reference=?,attachment_link=? WHERE id=?',[$date,$rule['type'],$class,$category,$description,ac_decimal($amount),(int)$bank['id'],$destination,(int)$counter['id'],$dim['department_id'],$dim['batch'],$dim['student_id'],$dim['vendor_id'],$dim['party_name'],$method,$reference,$link?:null,$id]);
            ac_audit($db,$actor,'transaction',(string)$id,'draft_updated',['previous'=>$editing,'next'=>$data]);
        }else{
        ac_query($db,'INSERT INTO accounting_transactions(request_key,transaction_date,type,classification,source_type,source_id,source_number,category,description,amount,cash_account_id,destination_cash_account_id,counter_account_id,department_id,batch,student_id,vendor_id,party_name,payment_method,reference,created_by,created_by_name,legacy_finance_id,attachment_link) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [$key,$date,$rule['type'],$class,$sourceType,$sourceId,$sourceNumber,$category,$description,ac_decimal($amount),(int)$bank['id'],$destination,(int)$counter['id'],$dim['department_id'],$dim['batch'],$dim['student_id'],$dim['vendor_id'],$dim['party_name'],$method,$reference,(int)$actor['id'],$actor['name'],$legacy,$link?:null]);
        $id=(int)$db->insert_id;$number='TRX-'.substr($date,0,4).'-'.str_pad((string)$id,8,'0',STR_PAD_LEFT);
        ac_query($db,'UPDATE accounting_transactions SET number=?,source_number=IF(source_type=\'cash_transaction\',?,source_number),source_id=IF(source_type=\'cash_transaction\',?,source_id) WHERE id=?',[$number,$number,(string)$id,$id]);
        }
        if($upload)$newProof=ac_store_proof($db,$id,$upload);
        ac_audit($db,$actor,'transaction',(string)$id,$editing?'saved':'created',['number'=>$number,'source_type'=>$sourceType,'source_id'=>$sourceType==='cash_transaction'?(string)$id:$sourceId]);
        if(isset($docType,$docId))ac_audit($db,$actor,'transaction',(string)$id,'document_link',['type'=>$docType,'id'=>$docId]);
        $result=['id'=>$id,'number'=>$number];ac_remember($db,$actor,$key,$operation,$data,$result);return $result;
    };
    try{return $inside?$work():ac_atomic($db,$work);}catch(Throwable $e){if($newProof&&is_file($newProof))unlink($newProof);throw $e;}
}
function ac_proof_dir():string{return defined('ACCOUNTING_PROOF_DIR')?ACCOUNTING_PROOF_DIR:__DIR__.'/../storage/finance-proofs';}
function ac_store_proof(mysqli $db,int $id,array $upload):string {
    if(($upload['error']??UPLOAD_ERR_NO_FILE)!==UPLOAD_ERR_OK||!is_uploaded_file($upload['tmp_name']??'')||filesize($upload['tmp_name'])>5*1024*1024)ac_fail('Bukti maksimal 5 MB.');
    $mime=(new finfo(FILEINFO_MIME_TYPE))->file($upload['tmp_name']);if(!in_array($mime,['image/jpeg','image/png','image/webp','application/pdf'],true))ac_fail('Bukti harus JPG/PNG/WebP/PDF.');
    if(!is_dir(ac_proof_dir())&&!mkdir(ac_proof_dir(),0750,true))ac_fail('Penyimpanan bukti tidak tersedia.',500);
    $key=bin2hex(random_bytes(16));$path=ac_proof_dir().'/'.$key.'.bin';
    if(!move_uploaded_file($upload['tmp_name'],$path))ac_fail('Bukti gagal disimpan.',500);
    try{ac_query($db,'UPDATE accounting_transactions SET attachment_key=?,attachment_name=? WHERE id=?',[$key,ac_text(basename($upload['name']),'Nama bukti',255),$id]);}catch(Throwable $e){unlink($path);throw $e;}
    return $path;
}
function ac_transaction_action(mysqli $db,array $actor,array $data):array {
    $action=$data['action']??'';$id=ac_id($data['id']??null);$key=ac_key($data['request_key']??'');
    $permission=in_array($action,['approve','reject','return_revision'],true)?'approve':($action==='post'||$action==='verify'||$action==='reverse'?'post':'prepare');ac_require($db,$actor,$permission);
    return ac_atomic($db,function()use($db,$actor,$data,$action,$id,$key){
        $retry=ac_retry($db,$actor,$key,'transaction_'.$action,$data);if($retry)return $retry;
        $t=ac_one($db,'SELECT * FROM accounting_transactions WHERE id=? FOR UPDATE',[$id]);if(!$t)ac_fail('Transaksi tidak ditemukan.',404);
        if($action==='reopen'){
            if((int)$t['created_by']!==(int)$actor['id']||$t['payment_status']!=='unpaid'||!in_array($t['approval_status'],['cancelled','rejected'],true)||$t['journal_status']!=='unposted')ac_fail('Transaksi tidak dapat dibuka untuk koreksi draft.',409);
            if(ac_one($db,'SELECT id FROM budget_realizations WHERE transaction_id=?',[$id]))ac_fail('Buat realisasi baru agar batas anggaran diverifikasi ulang.',409);
            ac_text($data['note']??'','Alasan koreksi',2000);ac_query($db,"UPDATE accounting_transactions SET approval_status='draft',approved_by=NULL,approved_by_name=NULL,approved_at=NULL,approval_note=NULL WHERE id=?",[$id]);
        }elseif($action==='submit'){
            if($t['approval_status']!=='draft'||(int)$t['created_by']!==(int)$actor['id'])ac_fail('Hanya pembuat draft yang dapat mengajukan.',409);
            ac_query($db,"UPDATE accounting_transactions SET approval_status='submitted' WHERE id=?",[$id]);
        }elseif($action==='return_revision'){
            if(!in_array($t['approval_status'],['submitted','approved'],true)||$t['payment_status']!=='unpaid')ac_fail('Transaksi yang telah dibayar tidak dapat dikembalikan.',409);if((int)$t['created_by']===(int)$actor['id'])ac_fail('Keputusan harus dilakukan reviewer lain.',403);ac_text($data['note']??'','Alasan revisi',2000);ac_query($db,"UPDATE accounting_transactions SET approval_status='draft',approved_by=NULL,approved_by_name=NULL,approved_at=NULL,approval_note=NULL WHERE id=?",[$id]);
        }elseif(in_array($action,['approve','reject'],true)){
            if($t['approval_status']!=='submitted')ac_fail('Transaksi tidak menunggu approval.',409);
            if((int)$t['created_by']===(int)$actor['id'])ac_fail('Pengaju tidak boleh menyetujui sendiri.',403);
            $note=ac_text($data['note']??'','Catatan keputusan',2000,$action==='reject');
            ac_query($db,'UPDATE accounting_transactions SET approval_status=?,approved_by=?,approved_by_name=?,approved_at=NOW(),approval_note=? WHERE id=?',[$action==='approve'?'approved':'rejected',(int)$actor['id'],$actor['name'],$note,$id]);
        }elseif($action==='pay'){
            if($t['approval_status']!=='approved'||$t['payment_status']!=='unpaid')ac_fail('Pembayaran hanya untuk transaksi approved yang belum dibayar.',409);
            $reference=ac_text($data['reference']??$t['reference'],'Referensi pembayaran',180);
            if(!$t['attachment_key']&&!$t['attachment_link'])ac_fail('Tambahkan bukti pembayaran sebelum pencatatan pembayaran.');
            ac_query($db,"UPDATE accounting_transactions SET payment_status='paid',paid_at=NOW(),reference=? WHERE id=?",[$reference,$id]);
        }elseif($action==='verify'){
            if($t['approval_status']!=='approved'||$t['payment_status']!=='paid')ac_fail('Pembayaran belum dicatat.',409);
            ac_query($db,"UPDATE accounting_transactions SET payment_status='verified',verified_by=?,verified_at=NOW() WHERE id=?",[(int)$actor['id'],$id]);
        }elseif($action==='post'){
            if($t['journal_status']==='posted')return ['id'=>$id,'journal_entry_id'=>$t['journal_entry_id']];
            if($t['approval_status']!=='approved'||$t['payment_status']!=='verified')ac_fail('Approval dan verifikasi pembayaran wajib sebelum posting.',409);
            $rule=ac_classifications()[$t['classification']];$bank=ac_bank($db,(int)$t['cash_account_id']);$counter=ac_account($db,(int)$t['counter_account_id']);
            $flow=$rule['flow'];if(!$flow){$flow=ac_text($data['cash_flow_class']??'','Aktivitas arus kas',20);if(!in_array($flow,['operating','investing','financing'],true))ac_fail('Aktivitas arus kas wajib diklasifikasikan.');}
            $dim=['department_id'=>$t['department_id'],'batch'=>$t['batch'],'student_id'=>$t['student_id'],'vendor_id'=>$t['vendor_id'],'party_name'=>$t['party_name'],'document_type'=>$t['source_type'],'document_id'=>$t['source_id']];
            if(!empty($rule['documents'])){
                $docType=$t['source_type'];$docId=$t['source_id'];
                if(in_array($docType,['legacy_finance','invoice_payment','billing_payment'],true)){$creation=ac_one($db,"SELECT details_json FROM accounting_audit_logs WHERE entity_type='transaction' AND entity_id=? AND action='document_link'",[(string)$id]);if(!$creation)ac_fail('Dokumen alokasi belum ditautkan.',409);$link=json_decode($creation['details_json'],true);$docType=$link['type'];$docId=$link['id'];}
                $doc=ac_one($db,'SELECT * FROM accounting_source_documents WHERE source_type=? AND source_id=? FOR UPDATE',[$docType,$docId]);if(!$doc)ac_fail('Dokumen pengakuan tidak tersedia.',409);
                if(ac_one($db,'SELECT id FROM journal_entries WHERE reversal_of=?',[(int)$doc['journal_entry_id']]))ac_fail('Pengakuan dokumen telah direversal.',409);
                $paid=ac_one($db,'SELECT COALESCE(SUM(amount),0) AS total FROM payment_allocations WHERE source_document_id=? AND is_reversed=0',[(int)$doc['id']]);
                if(ac_cents($t['amount'])>ac_cents($doc['amount'])-ac_cents($paid['total']))ac_fail('Nominal melebihi outstanding dokumen.',409);
                ac_query($db,'INSERT INTO payment_allocations(transaction_id,source_document_id,amount) VALUES(?,?,?)',[$id,(int)$doc['id'],$t['amount']]);$dim['document_type']=$docType;$dim['document_id']=$docId;
            }
            if($t['type']==='income'){$lines=[array_merge($dim,['account_id'=>(int)$bank['account_id'],'debit'=>$t['amount'],'cash_flow_class'=>$flow]),array_merge($dim,['account_id'=>(int)$counter['id'],'credit'=>$t['amount']])];}
            else{$lines=[array_merge($dim,['account_id'=>(int)$counter['id'],'debit'=>$t['amount'],'cash_flow_class'=>$t['type']==='transfer'?'transfer':'noncash']),array_merge($dim,['account_id'=>(int)$bank['account_id'],'credit'=>$t['amount'],'cash_flow_class'=>$flow])];}
            $journal=ac_post($db,$actor,$t['transaction_date'],'transaction',(string)$id,'cash_post',$t['description'],$lines);
            ac_query($db,"UPDATE accounting_transactions SET journal_status='posted',journal_entry_id=? WHERE id=?",[(int)$journal['id'],$id]);
            ac_query($db,'UPDATE budget_realizations SET journal_entry_id=? WHERE transaction_id=?',[(int)$journal['id'],$id]);
        }elseif($action==='reverse'){
            if($t['journal_status']!=='posted')ac_fail('Transaksi belum posted.',409);
            ac_reverse($db,$actor,(int)$t['journal_entry_id'],ac_date($data['date']??''),ac_text($data['note']??'','Alasan reversal',2000));
        }elseif($action==='cancel'){
            if($t['payment_status']!=='unpaid'||!in_array($t['approval_status'],['draft','submitted','rejected'],true))ac_fail('Gunakan reversal untuk transaksi yang telah dibayar.',409);
            if((int)$t['created_by']!==(int)$actor['id'])ac_fail('Hanya pembuat dapat membatalkan.',403);ac_query($db,"UPDATE accounting_transactions SET approval_status='cancelled' WHERE id=?",[$id]);
            $real=ac_one($db,'SELECT * FROM budget_realizations WHERE transaction_id=? FOR UPDATE',[$id]);if($real){ac_query($db,"UPDATE budget_realizations SET status='cancelled' WHERE id=?",[(int)$real['id']]);ac_query($db,"UPDATE budget_requests SET status='partially_realized',version=version+1 WHERE id=? AND status<>'closed'",[(int)$real['budget_request_id']]);ac_audit($db,$actor,'budget',(string)$real['budget_request_id'],'realization_cancelled',['realization_id'=>$real['id']]);}
        }else ac_fail('Aksi transaksi tidak dikenal.');
        ac_audit($db,$actor,'transaction',(string)$id,$action,['note'=>$data['note']??'']);$result=['id'=>$id];ac_remember($db,$actor,$key,'transaction_'.$action,$data,$result);return $result;
    });
}
