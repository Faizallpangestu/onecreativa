<?php
require_once __DIR__.'/accounting_documents.php';
require_once __DIR__.'/budget_workflow.php';
function ac_budget_realize(mysqli $db,array $actor,array $data,?array $upload=null):array {
    $key=ac_key($data['request_key']??'');$mode=$data['mode']??'realization';ac_require($db,$actor,$mode==='close'?'approve':'prepare');
    if(!in_array($mode,['realization','commitment','cancel_commitment','close'],true))ac_fail('Aksi komitmen/realisasi tidak valid.');
    if($mode==='close')ac_require($db,$actor,'approve');
    return ac_atomic($db,function()use($db,$actor,$data,$key,$mode,$upload){
        $retry=ac_retry($db,$actor,$key,'budget_'.$mode,$data);if($retry)return $retry;
        $budgetId=ac_id($data['budget_request_id']??null);$budget=ac_one($db,'SELECT * FROM budget_requests WHERE id=? FOR UPDATE',[$budgetId]);
        if(!$budget||!in_array($budget['status'],['approved','partially_realized','fully_realized'],true)||$budget['approved_amount']===null)ac_fail('RAB belum memiliki anggaran item yang disetujui.',409);
        if($mode==='close'){
            $note=ac_text($data['note']??'','Alasan penutupan',2000);
            if(ac_one($db,"SELECT c.id FROM budget_commitments c JOIN budget_request_items i ON i.id=c.budget_item_id WHERE i.budget_request_id=? AND c.status='open' LIMIT 1",[$budgetId]))ac_fail('Selesaikan atau batalkan komitmen terbuka.',409);
            if(ac_one($db,"SELECT r.id FROM budget_realizations r JOIN accounting_transactions t ON t.id=r.transaction_id WHERE r.budget_request_id=? AND r.status='recorded' AND t.journal_status<>'posted' LIMIT 1",[$budgetId]))ac_fail('Realisasi masih menunggu posting pembayaran.',409);
            ac_query($db,"UPDATE budget_requests SET status='closed',version=version+1 WHERE id=?",[$budgetId]);budget_history($db,$budgetId,$actor,'close',$budget['status'],'closed',$note);$result=['budget_request_id'=>$budgetId,'status'=>'closed'];ac_remember($db,$actor,$key,'budget_'.$mode,$data,$result);return $result;
        }
        $itemId=ac_id($data['budget_item_id']??null);$item=ac_one($db,'SELECT * FROM budget_request_items WHERE id=? AND budget_request_id=? FOR UPDATE',[$itemId,$budgetId]);if(!$item||$item['approved_amount']===null)ac_fail('Item RAB tidak disetujui.');
        $commitment=null;
        if(!empty($data['commitment_id'])){$commitment=ac_one($db,"SELECT * FROM budget_commitments WHERE id=? AND budget_item_id=? AND status='open' FOR UPDATE",[ac_id($data['commitment_id']),$itemId]);if(!$commitment)ac_fail('Komitmen tidak tersedia.',409);}
        if($mode==='cancel_commitment'){
            if(!$commitment)ac_fail('Pilih komitmen yang dibatalkan.');
            ac_query($db,"UPDATE budget_commitments SET status='cancelled' WHERE id=?",[(int)$commitment['id']]);$result=['commitment_id'=>$commitment['id']];
        }else{
            $amount=ac_cents($data['amount']??'');if(!$amount)ac_fail('Nominal harus positif.');
            $c=ac_one($db,"SELECT COALESCE(SUM(amount),0) AS amount FROM budget_commitments WHERE budget_item_id=? AND status='open'",[$itemId]);$r=ac_one($db,"SELECT COALESCE(SUM(amount),0) AS amount FROM budget_realizations WHERE budget_item_id=? AND status='recorded'",[$itemId]);
            $available=ac_cents($item['approved_amount'])-ac_cents($c['amount'])-ac_cents($r['amount'])+($commitment?ac_cents($commitment['amount']):0);
            if($amount>$available)ac_fail('Nominal melebihi sisa anggaran. Ajukan revisi anggaran; tidak ada bypass over-budget.',409);
            if($mode==='commitment'){
                if($commitment)ac_fail('Komitmen baru tidak boleh mengonsumsi komitmen lain.');
                ac_query($db,'INSERT INTO budget_commitments(budget_item_id,amount,created_by) VALUES(?,?,?)',[$itemId,ac_decimal($amount),(int)$actor['id']]);$result=['commitment_id'=>(int)$db->insert_id];
            }else{
                $class=$data['classification']??'';if(!in_array($class,['expense','asset','prepayment','vendor_bill'],true))ac_fail('Pilih beban/aset/uang muka/pelunasan tagihan.');
                $vendor=ac_id($data['vendor_id']??null,'Vendor');if(!ac_one($db,'SELECT id FROM vendors WHERE id=? AND is_active=1',[$vendor]))ac_fail('Vendor tidak ditemukan.');
                $bill=null;if($class==='vendor_bill'){$bill=ac_id($data['vendor_bill_id']??null,'Vendor bill');$s=ac_source($db,'vendor_bill',(string)$bill,true);if((int)$s['record']['vendor_id']!==$vendor)ac_fail('Vendor tidak sesuai tagihan.');}
                $proof=ac_text($data['attachment_link']??'','Link dokumen pendukung',2048,!$upload);
                ac_query($db,'INSERT INTO budget_realizations(request_key,budget_request_id,budget_item_id,amount,classification,vendor_id,vendor_bill_id,commitment_id,created_by) VALUES(?,?,?,?,?,?,?,?,?)',[$key,$budgetId,$itemId,ac_decimal($amount),$class,$vendor,$bill,$commitment?(int)$commitment['id']:null,(int)$actor['id']]);$id=(int)$db->insert_id;
                $classification=['expense'=>'operating_expense','asset'=>'asset_purchase','prepayment'=>'prepayment','vendor_bill'=>'vendor_payment'][$class];
                $cashData=$data;$cashData['request_key']=$key.'_cash';$cashData['classification']=$classification;$cashData['source_type']=$bill?'vendor_bill':'budget_realization';$cashData['source_id']=(string)($bill??$id);$cashData['description']='Realisasi RAB-'.str_pad((string)$budgetId,6,'0',STR_PAD_LEFT).' / '.$item['description'];$cashData['category']=$item['category'];$cashData['department_id']=$budget['department_id'];$cashData['attachment_link']=$proof;
                $cash=ac_transaction_create($db,$actor,$cashData,$upload,true);ac_query($db,'UPDATE budget_realizations SET transaction_id=? WHERE id=?',[$cash['id'],$id]);
                if($commitment)ac_query($db,"UPDATE budget_commitments SET status='consumed' WHERE id=?",[(int)$commitment['id']]);
                $total=ac_one($db,"SELECT COALESCE(SUM(amount),0) AS amount FROM budget_realizations WHERE budget_request_id=? AND status='recorded'",[$budgetId]);
                ac_query($db,'UPDATE budget_requests SET status=?,version=version+1 WHERE id=?',[ac_cents($total['amount'])===ac_cents($budget['approved_amount'])?'fully_realized':'partially_realized',$budgetId]);
                $result=['realization_id'=>$id,'transaction_id'=>$cash['id']];
            }
        }
        budget_history($db,$budgetId,$actor,$mode,$budget['status'],ac_one($db,'SELECT status FROM budget_requests WHERE id=?',[$budgetId])['status'],'Komitmen / realisasi item '.$itemId);
        ac_audit($db,$actor,'budget',(string)$budgetId,$mode,$result);ac_remember($db,$actor,$key,'budget_'.$mode,$data,$result);return $result;
    });
}
