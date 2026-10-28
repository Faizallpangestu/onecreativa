<?php
require_once __DIR__.'/accounting_cash.php';
function ac_vendor_bill(mysqli $db,array $actor,array $data):array {
    $approve=($data['action']??'')==='approve_bill';ac_require($db,$actor,$approve?'approve':'prepare');$key=ac_key($data['request_key']??'');
    return ac_atomic($db,function()use($db,$actor,$data,$approve,$key){
        $operation=$approve?'bill_approve':'bill_create';$retry=ac_retry($db,$actor,$key,$operation,$data);if($retry)return $retry;
        if($approve){$id=ac_id($data['id']??null);$bill=ac_one($db,'SELECT * FROM vendor_bills WHERE id=? FOR UPDATE',[$id]);if(!$bill||$bill['status']!=='draft')ac_fail('Tagihan tidak menunggu persetujuan.',409);if((int)$bill['created_by']===(int)$actor['id'])ac_fail('Pengaju tidak boleh menyetujui sendiri.',403);
            $note=ac_text($data['note']??'','Catatan',2000);ac_query($db,"UPDATE vendor_bills SET status='approved' WHERE id=?",[$id]);ac_audit($db,$actor,'vendor_bill',(string)$id,'approved',['note'=>$note]);
        }else{$vendor=ac_id($data['vendor_id']??null);if(!ac_one($db,'SELECT id FROM vendors WHERE id=? AND is_active=1',[$vendor]))ac_fail('Vendor tidak ditemukan.');$value=ac_cents($data['amount']??'');if(!$value)ac_fail('Nominal harus positif.');$account=ac_account($db,ac_id($data['account_id']??null));$liability=ac_account($db,ac_id($data['liability_account_id']??null));if(!in_array((int)$account['account_group'],[1,5],true)||$liability['report_class']!=='payable')ac_fail('Pilih COA aset/beban dan utang vendor.');
            $description=ac_text($data['description']??'','Deskripsi',2000);$link=ac_text($data['attachment_link']??'','Dokumen pendukung',2048);if(!filter_var($link,FILTER_VALIDATE_URL)||!in_array(parse_url($link,PHP_URL_SCHEME),['http','https'],true))ac_fail('Link dokumen harus HTTP(S).');
            $date=ac_date($data['bill_date']??'');$due=ac_date(empty($data['due_date'])?$date:$data['due_date']);ac_query($db,'INSERT INTO vendor_bills(number,vendor_id,bill_date,due_date,amount,account_id,liability_account_id,created_by) VALUES(?,?,?,?,?,?,?,?)',[ac_text($data['number']??'','Nomor tagihan',50),$vendor,$date,$due,ac_decimal($value),(int)$account['id'],(int)$liability['id'],(int)$actor['id']]);$id=(int)$db->insert_id;ac_audit($db,$actor,'vendor_bill',(string)$id,'created',['description'=>$description,'attachment_link'=>$link]);
        }
        $result=['id'=>$id];ac_remember($db,$actor,$key,$operation,$data,$result);return $result;
    });
}
