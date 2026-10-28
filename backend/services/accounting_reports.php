<?php
require_once __DIR__.'/accounting_ledger.php';
function ac_report_filter(array $data,bool $date=true):array {
    $where=["j.status='posted'"];$params=[];
    $from=empty($data['from'])?null:ac_date($data['from']);$to=empty($data['to'])?date('Y-m-d'):ac_date($data['to']);
    if($from&&$from>$to)ac_fail('Rentang tanggal terbalik.');
    $where[]='j.entry_date<=?';$params[]=$to;
    if($date&&$from){$where[]='j.entry_date>=?';$params[]=$from;}
    foreach(['department_id','student_id','vendor_id','account_id'] as $key)if(!empty($data[$key])){$where[]="l.$key=?";$params[]=ac_id($data[$key]);}
    if(!empty($data['batch'])){$where[]='l.batch=?';$params[]=ac_text($data['batch'],'Batch',100);}
    return [' WHERE '.implode(' AND ',$where),$params,$from,$to];
}
function ac_reports(mysqli $db,array $data):array {
    [$where,$params,$from,$to]=ac_report_filter($data);[$asOf,$asOfParams]=ac_report_filter($data,false);
    $joins=' FROM journal_lines l JOIN journal_entries j ON j.id=l.journal_entry_id JOIN accounts a ON a.id=l.account_id';
    $movement=ac_rows($db,'SELECT a.id,a.code,a.name,a.account_group,a.report_class,a.normal_balance,CAST(SUM(l.debit) AS CHAR) AS debit,CAST(SUM(l.credit) AS CHAR) AS credit'.$joins.$where.' GROUP BY a.id ORDER BY a.code',$params);
    $balances=ac_rows($db,'SELECT a.id,a.code,a.name,a.account_group,a.report_class,a.normal_balance,CAST(SUM(l.debit) AS CHAR) AS debit,CAST(SUM(l.credit) AS CHAR) AS credit'.$joins.$asOf.' GROUP BY a.id ORDER BY a.code',$asOfParams);
    $totals=['revenue'=>0,'other_income'=>0,'cost_of_services'=>0,'operating_expense'=>0,'other_expense'=>0,'income_tax'=>0];
    $debit=0;$credit=0;
    foreach($movement as &$row){$d=ac_cents($row['debit']);$c=ac_cents($row['credit']);$debit=ac_add($debit,$d);$credit=ac_add($credit,$c);$row['balance']=ac_decimal($row['normal_balance']==='debit'?$d-$c:$c-$d);if(isset($totals[$row['report_class']]))$totals[$row['report_class']]=ac_add($totals[$row['report_class']],$row['account_group']==4?$c-$d:$d-$c);}unset($row);
    $pnl=$totals;$pnl['gross_profit']=$totals['revenue']-$totals['cost_of_services'];$pnl['operating_profit']=$pnl['gross_profit']-$totals['operating_expense'];$pnl['profit_before_tax']=$pnl['operating_profit']+$totals['other_income']-$totals['other_expense'];$pnl['net_profit']=$pnl['profit_before_tax']-$totals['income_tax'];$pnl=array_map('ac_decimal',$pnl);
    $sheet=['assets'=>0,'liabilities'=>0,'equity'=>0,'unclosed_profit'=>0,'cash_bank'=>0,'receivables'=>0,'payables'=>0];
    $tbDebit=0;$tbCredit=0;
    foreach($balances as &$row){$d=ac_cents($row['debit']);$c=ac_cents($row['credit']);$net=$d-$c;$row['balance']=ac_decimal($net);$row['closing_debit']=ac_decimal(max(0,$net));$row['closing_credit']=ac_decimal(max(0,-$net));$tbDebit=ac_add($tbDebit,max(0,$net));$tbCredit=ac_add($tbCredit,max(0,-$net));
        if($row['account_group']==1)$sheet['assets']=ac_add($sheet['assets'],$net);elseif($row['account_group']==2)$sheet['liabilities']=ac_add($sheet['liabilities'],-$net);elseif($row['account_group']==3)$sheet['equity']=ac_add($sheet['equity'],-$net);else $sheet['unclosed_profit']=ac_add($sheet['unclosed_profit'],-$net);
        if($row['report_class']==='cash')$sheet['cash_bank']=ac_add($sheet['cash_bank'],$net);if($row['report_class']==='receivable')$sheet['receivables']=ac_add($sheet['receivables'],$net);if(in_array($row['report_class'],['payable','payroll_payable','reimbursement_payable','loan','tax_payable'],true))$sheet['payables']=ac_add($sheet['payables'],-$net);
    }unset($row);
    $sheet['total_equity']=$sheet['equity']+$sheet['unclosed_profit'];$sheet['difference']=$sheet['assets']-$sheet['liabilities']-$sheet['total_equity'];$sheet=array_map('ac_decimal',$sheet);
    $cashFlow=ac_rows($db,"SELECT l.cash_flow_class,CAST(SUM(l.debit) AS CHAR) AS incoming,CAST(SUM(l.credit) AS CHAR) AS outgoing,CAST(SUM(l.debit-l.credit) AS CHAR) AS net$joins$where AND a.report_class='cash' GROUP BY l.cash_flow_class",$params);
    $gl=ac_rows($db,'SELECT j.id AS journal_id,j.number,j.entry_date,j.source_type,j.source_id,j.event,j.reversal_of,l.*,a.code,a.name'.$joins.$where.' ORDER BY j.entry_date,j.id,l.id',$params);
    // As-of aging includes original balances, settlements and reversals up to the report date.
    $aging=ac_rows($db,"SELECT l.document_type,l.document_id,a.report_class,MIN(j.entry_date) AS first_posted,MAX(d.due_date) AS due_date,CAST(SUM(l.debit-l.credit) AS CHAR) AS net_balance$joins LEFT JOIN accounting_source_documents d ON d.source_type=l.document_type AND d.source_id=l.document_id$asOf AND a.report_class IN ('receivable','payable','payroll_payable','reimbursement_payable') GROUP BY l.document_type,l.document_id,a.report_class HAVING SUM(l.debit-l.credit)<>0",$asOfParams);
    foreach($aging as &$row){$row['outstanding']=$row['report_class']==='receivable'?$row['net_balance']:ac_decimal(-self_signed_cents($row['net_balance']));$due=$row['due_date'];$row['days_overdue']=$due?max(0,(int)(new DateTimeImmutable($due))->diff(new DateTimeImmutable($to))->format('%r%a')):null;$days=$row['days_overdue'];$row['bucket']=$days===null?'unknown_due_date':($days===0?'current':($days<=30?'1_30':($days<=60?'31_60':($days<=90?'61_90':'90_plus'))));}unset($row);
    $equity=ac_rows($db,"SELECT a.code,a.name,CAST(SUM(l.credit-l.debit) AS CHAR) AS change_amount$joins$where AND a.account_group=3 GROUP BY a.id",$params);
    $budgetWhere='';$budgetParams=[];if($from){$budgetWhere.=' AND b.period>=?';$budgetParams[]=substr($from,0,7).'-01';}$budgetWhere.=' AND b.period<=?';$budgetParams[]=substr($to,0,7).'-01';if(!empty($data['department_id'])){$budgetWhere.=' AND b.department_id=?';$budgetParams[]=ac_id($data['department_id']);}
    $budget=ac_rows($db,"SELECT b.id,b.title,b.period,b.department_id,b.status,b.total_amount AS requested,b.approved_amount,CAST(COALESCE((SELECT SUM(c.amount) FROM budget_commitments c JOIN budget_request_items i ON i.id=c.budget_item_id WHERE i.budget_request_id=b.id AND c.status='open'),0) AS CHAR) AS committed_amount,CAST(COALESCE((SELECT SUM(r.amount) FROM budget_realizations r WHERE r.budget_request_id=b.id AND r.status='recorded'),0) AS CHAR) AS realized_amount FROM budget_requests b WHERE 1=1$budgetWhere ORDER BY b.period,b.id",$budgetParams);
    foreach($budget as &$b)$b['remaining_amount']=$b['approved_amount']===null?null:ac_decimal(ac_cents($b['approved_amount'])-ac_cents($b['committed_amount'])-ac_cents($b['realized_amount']));unset($b);
    $unreviewed=ac_one($db,'SELECT COUNT(*) AS count FROM ('.ac_ledger_sql($db).') x WHERE x.needs_review=1');
    $posted=ac_one($db,"SELECT COUNT(*) AS count FROM journal_entries WHERE status='posted'");
    $unposted=ac_one($db,"SELECT COUNT(*) AS count FROM accounting_transactions WHERE journal_status='unposted' AND payment_status IN ('paid','verified')");
    $unrecognized=0;foreach(['billing_invoice'=>['billing_invoices','1=1'],'invoice_client'=>['invoice_clients','1=1'],'salary'=>['salary_requests',"s.status IN ('approved','paid')"],'reimbursement'=>['reimbursements',"s.status='approved'"],'vendor_bill'=>['vendor_bills',"s.status='approved'"]]as $type=>[$table,$condition])if(ac_table($db,$table)){$count=ac_one($db,"SELECT COUNT(*) AS n FROM $table s WHERE $condition AND NOT EXISTS(SELECT 1 FROM accounting_source_documents d WHERE d.source_type=? AND d.source_id=CAST(s.id AS CHAR))",[$type]);$unrecognized+=(int)$count['n'];}
    $fundSources=ac_rows($db,'SELECT COALESCE(t.classification,j.source_type) AS classification,l.department_id,l.batch,l.student_id,l.vendor_id,CAST(SUM(l.debit-l.credit) AS CHAR) AS amount,COUNT(DISTINCT j.id) AS transactions'.$joins.' LEFT JOIN accounting_transactions t ON t.journal_entry_id=COALESCE(j.reversal_of,j.id)'.$where." AND a.report_class='cash' AND l.cash_flow_class<>'transfer' GROUP BY classification,l.department_id,l.batch,l.student_id,l.vendor_id",$params);
    $opening=0;
    if($from){$prior=ac_rows($db,'SELECT a.account_group,CAST(SUM(l.credit-l.debit) AS CHAR) AS amount'.$joins.$asOf.' AND j.entry_date<? AND a.account_group IN (3,4,5) GROUP BY a.account_group',array_merge($asOfParams,[$from]));foreach($prior as $p)$opening=ac_add($opening,self_signed_cents($p['amount']));}
    $running=[];foreach($balances as $b)if($b['report_class']==='cash')$running[(int)$b['id']]=self_signed_cents($b['balance']);
    foreach($movement as $m)if($m['report_class']==='cash')$running[(int)$m['id']]-=ac_cents($m['debit'])-ac_cents($m['credit']);
    $cashHistory=[];foreach($gl as $line)if(isset($running[(int)$line['account_id']])){$accountId=(int)$line['account_id'];$running[$accountId]=ac_add($running[$accountId],ac_cents($line['debit'])-ac_cents($line['credit']));$line['running_balance']=ac_decimal($running[$accountId]);$cashHistory[]=$line;}
    return ['from'=>$from,'to'=>$to,'coverage'=>['posted_journals'=>(int)$posted['count'],'legacy_needs_review'=>(int)$unreviewed['count'],'unposted_payments'=>(int)$unposted['count'],'unrecognized_documents'=>$unrecognized,'opening_balances_verified'=>null,'complete'=>false,'notice'=>'Laporan hanya mencakup jurnal posted. Kelengkapan periode/saldo awal belum disertifikasi melalui rekonsiliasi eksternal. Transaksi historis, pembayaran belum posted dan dokumen belum diakui perlu review. Dana kas umum tidak dialokasikan otomatis ke setiap sumber penerimaan.'],
        'profit_loss'=>$pnl,'balance_sheet'=>$sheet,'trial_balance'=>['rows'=>$balances,'debit'=>ac_decimal($tbDebit),'credit'=>ac_decimal($tbCredit),'balanced'=>$tbDebit===$tbCredit],
        'period_movements'=>['rows'=>$movement,'debit'=>ac_decimal($debit),'credit'=>ac_decimal($credit)],'general_ledger'=>$gl,'cash_history'=>$cashHistory,'cash_flow'=>$cashFlow,'equity_changes'=>['accounts'=>$equity,'opening_equity'=>ac_decimal($opening),'closing_equity'=>$sheet['total_equity'],'period_profit'=>$pnl['net_profit']],'aging'=>$aging,'budget_vs_actual'=>$budget,'fund_sources'=>$fundSources];
}
function self_signed_cents(string $amount):int{return str_starts_with($amount,'-')?-ac_cents(substr($amount,1)):ac_cents($amount);}
