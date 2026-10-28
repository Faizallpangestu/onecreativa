<?php
require_once __DIR__.'/accounting_cash.php';
function ac_recognize(mysqli $db,array $actor,array $data):array {
    ac_require($db,$actor,'post');$key=ac_key($data['request_key']??'');
    return ac_atomic($db,function()use($db,$actor,$data,$key){
        $retry=ac_retry($db,$actor,$key,'document_recognize',$data);if($retry)return $retry;
        $type=ac_text($data['source_type']??'','Jenis dokumen',40);$id=ac_text((string)($data['source_id']??''),'ID sumber',100);
        if(!in_array($type,['billing_invoice','invoice_client','salary','reimbursement','vendor_bill'],true))ac_fail('Dokumen ini tidak mendukung pengakuan piutang/utang.');
        $source=ac_source($db,$type,$id,true);
        if(ac_one($db,'SELECT id FROM accounting_source_documents WHERE source_type=? AND source_id=?',[$type,$id]))ac_fail('Dokumen sudah diakui; gunakan adjustment.',409);
        $control=ac_account($db,ac_id($data['control_account_id']??null,'Akun piutang/utang'));
        $recognition=ac_account($db,ac_id($data['recognition_account_id']??null,'Akun pengakuan'));
        $date=ac_date($data['date']??'');$due=empty($data['due_date'])?null:ac_date($data['due_date']);$amount=ac_cents($source['amount']);if(!$amount)ac_fail('Dokumen tidak memiliki nominal positif.');
        $income=in_array($type,['billing_invoice','invoice_client'],true);
        $expected=['billing_invoice'=>'receivable','invoice_client'=>'receivable','salary'=>'payroll_payable','reimbursement'=>'reimbursement_payable','vendor_bill'=>'payable'];
        if($control['report_class']!==$expected[$type])ac_fail('Akun kontrol tidak sesuai dokumen.');
        if($income&&!in_array($recognition['report_class'],['deferred_revenue','revenue','other_income'],true))ac_fail('Invoice harus diakui ke revenue/deferred revenue.');
        if(!$income&&!in_array((int)$recognition['account_group'],[1,5],true))ac_fail('Pengakuan tagihan harus aset atau beban.');
        $dimensionData=$data;$dimensionData['party_name']=$data['party_name']??$source['record']['employee_name']??$source['record']['customer']??$source['record']['name']??$source['number'];if($type==='vendor_bill')$dimensionData['vendor_id']=$source['record']['vendor_id'];
        $dim=array_merge(ac_dims($db,$dimensionData),['document_type'=>$type,'document_id'=>$id]);
        $lines=$income?[array_merge($dim,['account_id'=>(int)$control['id'],'debit'=>ac_decimal($amount)]),array_merge($dim,['account_id'=>(int)$recognition['id'],'credit'=>ac_decimal($amount)])]:[array_merge($dim,['account_id'=>(int)$recognition['id'],'debit'=>ac_decimal($amount)]),array_merge($dim,['account_id'=>(int)$control['id'],'credit'=>ac_decimal($amount)])];
        if($type==='salary'){
            $s=$source['record'];$gross=ac_cents($s['gross_salary']??$s['total_salary']);$leave=ac_cents($s['leave_deduction']??'0');
            $lines=[array_merge($dim,['account_id'=>(int)$recognition['id'],'debit'=>ac_decimal($gross-$leave)]),array_merge($dim,['account_id'=>(int)$control['id'],'credit'=>ac_decimal($amount)])];
            foreach(['kasbon_deduction','bpjs_tk_deduction','bpjs_kes_deduction'] as $field){$value=ac_cents($s[$field]??'0');if(!$value)continue;$acct=ac_account($db,ac_id($data['deduction_accounts'][$field]??null,"COA $field"));if($field==='kasbon_deduction'&&(int)$acct['account_group']!==1)ac_fail('Kasbon mengurangi piutang/uang muka.');if($field!=='kasbon_deduction'&&(int)$acct['account_group']!==2)ac_fail('Potongan BPJS harus kewajiban.');$lines[]=array_merge($dim,['account_id'=>(int)$acct['id'],'credit'=>ac_decimal($value)]);}
        }
        $journal=ac_post($db,$actor,$date,$type,$id,'recognition','Pengakuan '.$source['number'],$lines);
        ac_query($db,'INSERT INTO accounting_source_documents(source_type,source_id,number,document_date,due_date,amount,control_account_id,recognition_account_id,journal_entry_id) VALUES(?,?,?,?,?,?,?,?,?)',[$type,$id,$source['number'],$date,$due,ac_decimal($amount),(int)$control['id'],(int)$recognition['id'],(int)$journal['id']]);
        $result=['id'=>(int)$db->insert_id,'journal_entry_id'=>(int)$journal['id']];ac_audit($db,$actor,'document',$type.':'.$id,'recognized',$result);ac_remember($db,$actor,$key,'document_recognize',$data,$result);return $result;
    });
}
function ac_revenue_release(mysqli $db,array $actor,array $data):array {
    ac_require($db,$actor,'post');$key=ac_key($data['request_key']??'');
    return ac_atomic($db,function()use($db,$actor,$data,$key){
        $retry=ac_retry($db,$actor,$key,'revenue_release',$data);if($retry)return $retry;
        $doc=ac_one($db,'SELECT * FROM accounting_source_documents WHERE id=? FOR UPDATE',[ac_id($data['document_id']??null)]);if(!$doc)ac_fail('Dokumen tidak ditemukan.',404);
        $deferred=ac_account($db,(int)$doc['recognition_account_id']);if($deferred['report_class']!=='deferred_revenue')ac_fail('Dokumen tidak memakai deferred revenue.');
        $earned=ac_account($db,ac_id($data['account_id']??null));if((int)$earned['account_group']!==4)ac_fail('Pilih akun pendapatan.');
        if(ac_one($db,'SELECT id FROM journal_entries WHERE reversal_of=?',[(int)$doc['journal_entry_id']]))ac_fail('Dokumen telah direversal.',409);
        $released=ac_one($db,"SELECT COALESCE(SUM(l.debit-l.credit),0) AS amount FROM journal_lines l JOIN journal_entries j ON j.id=l.journal_entry_id WHERE j.status='posted' AND l.document_type=? AND l.document_id=? AND l.account_id=? AND (j.event='revenue_release' OR j.event='reversal')",[$doc['source_type'],$doc['source_id'],(int)$deferred['id']]);
        $value=ac_cents($data['amount']??'');if(!$value||$value>ac_cents($doc['amount'])-ac_cents($released['amount']))ac_fail('Pengakuan melebihi deferred revenue yang tersisa.');
        $evidence=ac_text($data['evidence']??'','Bukti layanan telah dipenuhi',2000);$origin=ac_one($db,'SELECT department_id,batch,student_id,vendor_id,party_name FROM journal_lines WHERE journal_entry_id=? AND account_id=? ORDER BY id LIMIT 1',[(int)$doc['journal_entry_id'],(int)$doc['control_account_id']]);$dims=array_merge($origin??[],['document_type'=>$doc['source_type'],'document_id'=>$doc['source_id']]);
        $journal=ac_post($db,$actor,ac_date($data['date']??''),'revenue_release',$key,'revenue_release',$evidence,[array_merge($dims,['account_id'=>(int)$deferred['id'],'debit'=>ac_decimal($value)]),array_merge($dims,['account_id'=>(int)$earned['id'],'credit'=>ac_decimal($value)])]);
        $result=['journal_entry_id'=>$journal['id']];ac_remember($db,$actor,$key,'revenue_release',$data,$result);return $result;
    });
}
