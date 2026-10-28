<?php
require_once __DIR__.'/accounting_core.php';
function ac_account(mysqli $db,int $id):array {
    $row=ac_one($db,'SELECT * FROM accounts WHERE id=? FOR UPDATE',[$id]);
    if (!$row || !$row['is_active'] || !$row['is_detail']) ac_fail('COA harus akun detail aktif.'); return $row;
}
// Internal posting function: caller must own an atomic transaction and source lock.
function ac_post(mysqli $db,array $actor,string $date,string $source,string $sourceId,string $event,string $description,array $lines,?int $reversal=null):array {
    ac_date($date);
    $period=ac_one($db,'SELECT * FROM accounting_periods WHERE month=? FOR UPDATE',[substr($date,0,7)]);
    if (!$period) ac_fail('Periode akuntansi belum dibuka.',409);
    if ($period['status']!=='open') ac_fail('Periode akuntansi sudah ditutup.',409);
    $existing=ac_one($db,'SELECT * FROM journal_entries WHERE source_type=? AND source_id=? AND event=?',[$source,$sourceId,$event]);
    if ($existing) return $existing;
    if (count($lines)<2 || count($lines)>200) ac_fail('Jurnal harus memiliki 2–200 baris.');
    $debit=0;$credit=0;
    foreach($lines as &$line) {
        $line['account_id']=ac_id($line['account_id']??null,'COA'); ac_account($db,$line['account_id']);
        $d=ac_cents($line['debit']??'0');$c=ac_cents($line['credit']??'0');
        if (($d>0 && $c>0) || ($d===0 && $c===0)) ac_fail('Setiap baris hanya boleh debit atau kredit.');
        $debit=ac_add($debit,$d);$credit=ac_add($credit,$c);
        $line['debit']=ac_decimal($d);$line['credit']=ac_decimal($c);
    } unset($line);
    if ($debit!==$credit) ac_fail('Total debit dan kredit harus sama.');
    ac_query($db,'INSERT INTO journal_entries(entry_date,period_id,source_type,source_id,event,description,created_by,reversal_of) VALUES(?,?,?,?,?,?,?,?)',[$date,(int)$period['id'],$source,$sourceId,$event,$description,(int)$actor['id'],$reversal]);
    $id=(int)$db->insert_id;$number='JRN-'.substr($date,0,4).'-'.str_pad((string)$id,8,'0',STR_PAD_LEFT);
    foreach($lines as $line) ac_query($db,'INSERT INTO journal_lines(journal_entry_id,account_id,debit,credit,department_id,batch,student_id,vendor_id,party_name,document_type,document_id,cash_flow_class) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
        [$id,$line['account_id'],$line['debit'],$line['credit'],$line['department_id']??null,$line['batch']??null,$line['student_id']??null,$line['vendor_id']??null,$line['party_name']??null,$line['document_type']??$source,$line['document_id']??$sourceId,$line['cash_flow_class']??'noncash']);
    ac_query($db,"UPDATE journal_entries SET number=?,status='posted',posted_at=NOW() WHERE id=?",[$number,$id]);
    ac_audit($db,$actor,'journal',(string)$id,'posted',['number'=>$number,'source_type'=>$source,'source_id'=>$sourceId,'debit'=>ac_decimal($debit),'credit'=>ac_decimal($credit),'reversal_of'=>$reversal]);
    return ac_one($db,'SELECT * FROM journal_entries WHERE id=?',[$id]);
}
function ac_journal_detail(mysqli $db,int $id):array {
    $row=ac_one($db,'SELECT j.*,p.month FROM journal_entries j JOIN accounting_periods p ON p.id=j.period_id WHERE j.id=?',[$id]);
    if (!$row) ac_fail('Jurnal tidak ditemukan.',404);
    $row['lines']=ac_rows($db,'SELECT l.*,a.code,a.name,a.account_group FROM journal_lines l JOIN accounts a ON a.id=l.account_id WHERE l.journal_entry_id=? ORDER BY l.id',[$id]);
    $row['reversals']=ac_rows($db,'SELECT id,number,entry_date FROM journal_entries WHERE reversal_of=?',[$id]); return $row;
}
function ac_reverse(mysqli $db,array $actor,int $id,string $date,string $reason):array {
    $original=ac_one($db,"SELECT * FROM journal_entries WHERE id=? AND status='posted' FOR UPDATE",[$id]);
    if(!$original) ac_fail('Jurnal posted tidak ditemukan.',404);
    if ($original['reversal_of']) ac_fail('Reversal tidak dapat direversal ulang; gunakan adjustment.',409);
    $already=ac_one($db,'SELECT * FROM journal_entries WHERE reversal_of=?',[$id]); if($already)return $already;
    $document=ac_one($db,'SELECT * FROM accounting_source_documents WHERE journal_entry_id=? FOR UPDATE',[$id]);
    if($document){
        if(ac_one($db,'SELECT id FROM payment_allocations WHERE source_document_id=? AND is_reversed=0 LIMIT 1',[(int)$document['id']]))ac_fail('Reversal pembayaran terkait terlebih dahulu.',409);
        if(ac_one($db,"SELECT j.id FROM journal_entries j JOIN journal_lines l ON l.journal_entry_id=j.id WHERE l.document_type=? AND l.document_id=? AND j.event='revenue_release' AND NOT EXISTS(SELECT 1 FROM journal_entries r WHERE r.reversal_of=j.id) LIMIT 1",[$document['source_type'],$document['source_id']]))ac_fail('Reversal pengakuan pendapatan terkait terlebih dahulu.',409);
    }
    $lines=ac_rows($db,'SELECT * FROM journal_lines WHERE journal_entry_id=?',[$id]);
    foreach($lines as &$line){[$line['debit'],$line['credit']]=[$line['credit'],$line['debit']];}unset($line);
    $result=ac_post($db,$actor,$date,'journal',(string)$id,'reversal',$reason,$lines,$id);
    $transaction=ac_one($db,'SELECT id FROM accounting_transactions WHERE journal_entry_id=? FOR UPDATE',[$id]);
    if($transaction){
        ac_query($db,"UPDATE accounting_transactions SET payment_status='reversed',journal_status='reversed' WHERE id=?",[(int)$transaction['id']]);
        ac_query($db,'UPDATE payment_allocations SET is_reversed=1 WHERE transaction_id=?',[(int)$transaction['id']]);
        $real=ac_one($db,'SELECT * FROM budget_realizations WHERE transaction_id=? FOR UPDATE',[(int)$transaction['id']]);
        if($real){ac_query($db,"UPDATE budget_realizations SET status='cancelled' WHERE id=?",[(int)$real['id']]);ac_query($db,"UPDATE budget_requests SET status='partially_realized',version=version+1 WHERE id=? AND status<>'closed'",[(int)$real['budget_request_id']]);ac_audit($db,$actor,'budget',(string)$real['budget_request_id'],'realization_reversed',['realization_id'=>$real['id'],'reason'=>$reason]);}
        ac_audit($db,$actor,'transaction',(string)$transaction['id'],'reversed',['journal_id'=>$result['id'],'reason'=>$reason]);
    }
    return $result;
}
function ac_master_mutate(mysqli $db,array $actor,array $data):array {
    $action=$data['action']??'';ac_require($db,$actor,'configure');
    if($action==='permission'&&$actor['role']!=='super_admin')ac_fail('Perubahan kebijakan izin hanya oleh Super Admin; administrator tidak dapat menambah hak approval sendiri.',403);
    return ac_atomic($db,function()use($db,$actor,$data,$action){
        if($action==='account'){
            $id=isset($data['id'])?ac_id($data['id']):null;
            $code=ac_text($data['code']??'','Kode akun',20);$name=ac_text($data['name']??'','Nama akun',150);
            $group=ac_id($data['account_group']??null,'Kelompok');if($group>5||!preg_match('/^'.$group.'\d{3,19}$/D',$code))ac_fail('Kode akun harus mengikuti kelompok 1–5.');
            $normal=$data['normal_balance']??($group===1||$group===5?'debit':'credit');if(!in_array($normal,['debit','credit'],true))ac_fail('Normal balance tidak valid.');
            $classes=[1=>['cash','receivable','inventory','fixed_asset','prepayment','other_asset'],2=>['payable','payroll_payable','loan','deferred_revenue','reimbursement_payable','tax_payable','other_liability'],3=>['capital','retained_earnings','other_equity'],4=>['revenue','other_income'],5=>['cost_of_services','operating_expense','other_expense','income_tax']];
            $class=$data['report_class']??'';if(!in_array($class,$classes[$group],true))ac_fail('Klasifikasi laporan tidak sesuai kelompok akun.');
            $parent=empty($data['parent_id'])?null:ac_id($data['parent_id']);$detail=($data['is_detail']??true)?1:0;$active=($data['is_active']??true)?1:0;
            if($parent){$seen=[];$next=$parent;while($next){if($next===$id||isset($seen[$next]))ac_fail('Parent akun membentuk siklus.');$seen[$next]=true;$p=ac_one($db,'SELECT * FROM accounts WHERE id=? FOR UPDATE',[$next]);if(!$p||(int)$p['account_group']!==$group||$p['is_detail'])ac_fail('Parent harus akun kelompok yang sesuai.');$next=(int)($p['parent_id']??0);}}
            if($id){$old=ac_one($db,'SELECT * FROM accounts WHERE id=? FOR UPDATE',[$id]);if(!$old)ac_fail('Akun tidak ditemukan.',404);
                if(ac_one($db,'SELECT id FROM journal_lines WHERE account_id=? LIMIT 1',[$id])&&($old['code']!==$code||(int)$old['account_group']!==$group||$old['normal_balance']!==$normal||$old['report_class']!==$class||!$detail))ac_fail('Struktur akun yang sudah memiliki jurnal dikunci.',409);
                ac_query($db,'UPDATE accounts SET code=?,name=?,account_group=?,normal_balance=?,parent_id=?,is_detail=?,is_active=?,report_class=? WHERE id=?',[$code,$name,$group,$normal,$parent,$detail,$active,$class,$id]);
            }else{ac_query($db,'INSERT INTO accounts(code,name,account_group,normal_balance,parent_id,is_detail,is_active,report_class) VALUES(?,?,?,?,?,?,?,?)',[$code,$name,$group,$normal,$parent,$detail,$active,$class]);$id=(int)$db->insert_id;}
            ac_audit($db,$actor,'account',(string)$id,'saved',['code'=>$code]);return ac_one($db,'SELECT * FROM accounts WHERE id=?',[$id]);
        }
        if($action==='bank'){$account=ac_account($db,ac_id($data['account_id']??null));if($account['report_class']!=='cash')ac_fail('Rekening harus memakai COA kas/bank.');ac_query($db,'INSERT INTO cash_bank_accounts(name,account_id,bank_name,account_number) VALUES(?,?,?,?)',[ac_text($data['name']??'','Nama rekening',150),(int)$account['id'],ac_text($data['bank_name']??'','Bank',100,false),ac_text($data['account_number']??'','Nomor rekening',100,false)]);$id=(int)$db->insert_id;ac_audit($db,$actor,'bank',(string)$id,'created');return ['id'=>$id];}
        if($action==='period'){
            $month=ac_text($data['month']??'','Periode',7);if(!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/D',$month))ac_fail('Periode harus YYYY-MM.');
            $status=$data['status']??'open';if(!in_array($status,['open','closed'],true))ac_fail('Status periode tidak valid.');
            ac_query($db,'INSERT IGNORE INTO accounting_periods(month) VALUES(?)',[$month]);$period=ac_one($db,'SELECT * FROM accounting_periods WHERE month=? FOR UPDATE',[$month]);
            if($status==='closed'&&ac_one($db,"SELECT id FROM journal_entries WHERE period_id=? AND status='draft' LIMIT 1",[(int)$period['id']]))ac_fail('Masih ada draft jurnal.',409);
            $reason=ac_text($data['reason']??'','Alasan perubahan periode',2000);
            ac_query($db,'UPDATE accounting_periods SET status=?,closed_by=?,closed_at=IF(?=\'closed\',NOW(),NULL) WHERE id=?',[$status,$status==='closed'?(int)$actor['id']:null,$status,(int)$period['id']]);ac_audit($db,$actor,'period',(string)$period['id'],$status,['reason'=>$reason]);return ['month'=>$month,'status'=>$status];
        }
        if($action==='permission'){$role=ac_text($data['role']??'','Role',50);if(!ac_one($db,'SELECT id FROM roles WHERE LOWER(name)=?',[$role]))ac_fail('Role tidak ditemukan.');$permission=$data['permission']??'';if(!in_array($permission,['read','prepare','approve','post','configure'],true))ac_fail('Permission tidak valid.');
            if($permission==='configure'&&$role==='super_admin'&&empty($data['allowed']))ac_fail('Hak konfigurasi Super Admin harus dipertahankan.');
            ac_query($db,'INSERT INTO finance_role_permissions(role_name,permission,allowed) VALUES(?,?,?) ON DUPLICATE KEY UPDATE allowed=VALUES(allowed)',[$role,$permission,empty($data['allowed'])?0:1]);ac_audit($db,$actor,'permission',$role,'changed',$data);return ['role'=>$role];}
        if($action==='vendor'){ac_query($db,'INSERT INTO vendors(name) VALUES(?)',[ac_text($data['name']??'','Nama vendor')]);$id=(int)$db->insert_id;ac_audit($db,$actor,'vendor',(string)$id,'created');return ['id'=>$id];}
        ac_fail('Aksi master tidak dikenal.');
    });
}
