<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private, max-age=0');
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../config/session.php';
require_once __DIR__.'/../services/accounting_reports.php';
require_once __DIR__.'/../services/budget_realization.php';
require_once __DIR__.'/../services/accounting_vendor.php';
require_once __DIR__.'/../services/accounting_journal.php';
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
            $students = [];
            if (ac_table($conn, 'peserta_intensif')) {
                $pCols = [];
                $cRes = mysqli_query($conn, "SHOW COLUMNS FROM peserta_intensif");
                if ($cRes) {
                    while ($cRow = mysqli_fetch_assoc($cRes)) {
                        $pCols[] = strtolower($cRow['Field']);
                    }
                }
                $missingCols = [
                    'affiliator' => "VARCHAR(100) DEFAULT NULL",
                    'nis'        => "VARCHAR(50) NULL",
                    'program'    => "VARCHAR(150) DEFAULT 'Program Pelatihan Jepang'",
                    'batch'      => "VARCHAR(100) DEFAULT 'Batch 2'",
                    'level'      => "VARCHAR(50) DEFAULT 'N5'",
                    'alamat'     => "TEXT DEFAULT NULL",
                    'kota'       => "VARCHAR(100) DEFAULT 'Kab. Cianjur'",
                    'provinsi'   => "VARCHAR(100) DEFAULT 'Jawa Barat'",
                    'kode_pos'   => "VARCHAR(20) DEFAULT '43211'",
                    'negara'     => "VARCHAR(50) DEFAULT 'Indonesia'",
                    'source'     => "VARCHAR(50) DEFAULT 'creativabridging.com'",
                    'status'     => "VARCHAR(50) DEFAULT 'Aktif'",
                    'no_ktp'     => "VARCHAR(50) NULL"
                ];
                foreach ($missingCols as $col => $def) {
                    if (!in_array($col, $pCols, true)) {
                        @mysqli_query($conn, "ALTER TABLE peserta_intensif ADD COLUMN `$col` $def");
                        $pCols[] = $col;
                    }
                }
                $selAffiliator = in_array('affiliator', $pCols, true) ? "affiliator" : "'' AS affiliator";
                $selNis = in_array('nis', $pCols, true) ? "nis" : "'' AS nis";
                $selBatch = in_array('batch', $pCols, true) ? "batch" : "'Batch 2' AS batch";
                $selLevel = in_array('level', $pCols, true) ? "level" : "'N5' AS level";
                $selAlamat = in_array('alamat', $pCols, true) ? "alamat" : "'' AS alamat";
                $selKota = in_array('kota', $pCols, true) ? "kota" : "'Kab. Cianjur' AS kota";
                $selProv = in_array('provinsi', $pCols, true) ? "provinsi" : "'Jawa Barat' AS provinsi";
                $selPos = in_array('kode_pos', $pCols, true) ? "kode_pos" : "'43211' AS kode_pos";
                $selNegara = in_array('negara', $pCols, true) ? "negara" : "'Indonesia' AS negara";
                $selProgram = in_array('program', $pCols, true) ? "program" : "'Program Pelatihan Jepang' AS program";
                $selStatus = in_array('status', $pCols, true) ? "status" : "'Aktif' AS status";
                $selName = in_array('nama_lengkap', $pCols, true) ? "nama_lengkap AS name" : (in_array('nama', $pCols, true) ? "nama AS name" : "'Siswa' AS name");
                $selPhone = in_array('no_wa', $pCols, true) ? "no_wa" : (in_array('phone', $pCols, true) ? "phone AS no_wa" : "'' AS no_wa");
                $selEmail = in_array('email', $pCols, true) ? "email" : "'' AS email";

                $students = ac_rows($conn, "SELECT id, $selName, $selBatch, $selPhone, $selEmail, $selLevel, $selNis, $selAffiliator, $selAlamat, $selKota, $selProv, $selPos, $selNegara, $selProgram, $selStatus FROM peserta_intensif ORDER BY id DESC");
            }
            $accounts = [];
            if (ac_table($conn, 'accounts')) {
                $hasJl = ac_table($conn, 'journal_lines') && ac_table($conn, 'journal_entries');
                if ($hasJl) {
                    $balSub = "COALESCE((SELECT SUM(CASE WHEN a.normal_balance = 'credit' THEN jl.credit - jl.debit ELSE jl.debit - jl.credit END) FROM journal_lines jl JOIN journal_entries je ON je.id=jl.journal_entry_id WHERE jl.account_id=a.id AND je.status='posted'), 0)";
                    $accounts = ac_rows($conn, "SELECT a.*, $balSub AS balance FROM accounts a ORDER BY a.code");
                } else {
                    $accounts = ac_rows($conn, "SELECT a.*, 0 AS balance FROM accounts a ORDER BY a.code");
                }
            }
            $banks = [];
            if (ac_table($conn,'cash_bank_accounts') && ac_table($conn,'accounts')) {
                $hasJl = ac_table($conn, 'journal_lines') && ac_table($conn, 'journal_entries');
                $balSub = $hasJl ? "COALESCE((SELECT SUM(jl.debit - jl.credit) FROM journal_lines jl JOIN journal_entries je ON je.id=jl.journal_entry_id WHERE jl.account_id=b.account_id AND je.status='posted'), 0)" : "0";
                $banks = ac_rows($conn, "SELECT b.*, a.code, $balSub AS balance FROM cash_bank_accounts b LEFT JOIN accounts a ON a.id=b.account_id ORDER BY b.name");
            }
            $periods = ac_table($conn,'accounting_periods') ? ac_rows($conn,'SELECT * FROM accounting_periods ORDER BY month DESC') : [];
            $vendors = ac_table($conn,'vendors') ? ac_rows($conn,'SELECT * FROM vendors ORDER BY name') : [];
            $documents = (ac_table($conn,'accounting_source_documents') && ac_table($conn,'payment_allocations')) ? ac_rows($conn,'SELECT d.*,CAST(d.amount-COALESCE((SELECT SUM(p.amount) FROM payment_allocations p WHERE p.source_document_id=d.id AND p.is_reversed=0),0) AS CHAR) AS outstanding FROM accounting_source_documents d ORDER BY d.id DESC') : (ac_table($conn,'accounting_source_documents') ? ac_rows($conn,'SELECT d.*,CAST(d.amount AS CHAR) AS outstanding FROM accounting_source_documents d ORDER BY d.id DESC') : []);
            $data=['accounts'=>$accounts,'banks'=>$banks,'periods'=>$periods,'vendors'=>$vendors,'departments'=>$departments,'students'=>$students,'classifications'=>ac_classifications(),'documents'=>$documents];
            if($permissions['configure'] && ac_table($conn,'finance_role_permissions'))$data['role_permissions']=ac_rows($conn,'SELECT * FROM finance_role_permissions ORDER BY role_name,permission');
            $data['vendor_bills']=(ac_table($conn,'vendor_bills') && ac_table($conn,'vendors')) ? ac_rows($conn,'SELECT b.*,v.name AS vendor_name FROM vendor_bills b JOIN vendors v ON v.id=b.vendor_id ORDER BY b.id DESC') : [];
            if (ac_table($conn,'journal_lines')) {
                foreach($data['documents']as &$doc)$doc['dimensions']=ac_one($conn,'SELECT department_id,batch,student_id,vendor_id FROM journal_lines WHERE journal_entry_id=? AND account_id=? ORDER BY id LIMIT 1',[(int)$doc['journal_entry_id'],(int)$doc['control_account_id']]);unset($doc);
            }
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
                'legacy_finance'=>['finance_records',"SELECT f.id,CONCAT('FIN-',f.id) AS number,f.amount,f.description AS party_name,f.transaction_date FROM finance_records f LEFT JOIN accounting_transactions t ON t.legacy_finance_id=f.id WHERE t.id IS NULL ORDER BY f.id DESC"]
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
        elseif($view==='reconciliations'){
            if(!ac_table($conn,'bank_reconciliations')){
                @mysqli_query($conn,"CREATE TABLE IF NOT EXISTS bank_reconciliations (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    account_id INT UNSIGNED NOT NULL,
                    period_from DATE NOT NULL,
                    period_to DATE NOT NULL,
                    statement_balance DECIMAL(15,2) NOT NULL,
                    book_balance DECIMAL(15,2) NOT NULL,
                    difference DECIMAL(15,2) NOT NULL,
                    statement_reference VARCHAR(150) NOT NULL,
                    notes TEXT NULL,
                    status ENUM('reconciled','variance') NOT NULL DEFAULT 'reconciled',
                    reconciled_by INT UNSIGNED NOT NULL,
                    reconciled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    INDEX(account_id, period_to)
                ) ENGINE=InnoDB");
            }
            $accFilter = !empty($_GET['account_id']) ? "WHERE r.account_id=" . (int)$_GET['account_id'] : "";
            $data = ac_rows($conn, "SELECT r.*, a.name AS account_name, a.code AS account_code FROM bank_reconciliations r LEFT JOIN accounts a ON a.id=r.account_id $accFilter ORDER BY r.id DESC");
        }
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
        elseif(in_array($action,['account','delete_account','bank','delete_bank','period','permission','vendor','delete_vendor','delete','delete_transaction'],true))$data=ac_master_mutate($conn,$actor,$body);
        elseif($action==='save_reconciliation'){
            if(!ac_table($conn,'bank_reconciliations')){
                @mysqli_query($conn,"CREATE TABLE IF NOT EXISTS bank_reconciliations (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    account_id INT UNSIGNED NOT NULL,
                    period_from DATE NOT NULL,
                    period_to DATE NOT NULL,
                    statement_balance DECIMAL(15,2) NOT NULL,
                    book_balance DECIMAL(15,2) NOT NULL,
                    difference DECIMAL(15,2) NOT NULL,
                    statement_reference VARCHAR(150) NOT NULL,
                    notes TEXT NULL,
                    status ENUM('reconciled','variance') NOT NULL DEFAULT 'reconciled',
                    reconciled_by INT UNSIGNED NOT NULL,
                    reconciled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    INDEX(account_id, period_to)
                ) ENGINE=InnoDB");
            }
            $accId = (int)($body['account_id'] ?? 0);
            if(!$accId) ac_fail('Akun kas/bank wajib dipilih.');
            $pFrom = ac_date($body['period_from'] ?? date('Y-m-01'));
            $pTo = ac_date($body['period_to'] ?? date('Y-m-d'));
            $stmtBal = (float)($body['statement_balance'] ?? 0);
            $bookBal = (float)($body['book_balance'] ?? 0);
            $diff = $stmtBal - $bookBal;
            $ref = ac_text($body['statement_reference'] ?? 'Statement Bank', 'Referensi', 150);
            $notes = ac_text($body['notes'] ?? '', 'Catatan', 2000);
            $status = abs($diff) < 0.01 ? 'reconciled' : 'variance';
            $actorId = (int)($actor['id'] ?? 1);
            ac_query($conn, "INSERT INTO bank_reconciliations (account_id, period_from, period_to, statement_balance, book_balance, difference, statement_reference, notes, status, reconciled_by, reconciled_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
                [$accId, $pFrom, $pTo, $stmtBal, $bookBal, $diff, $ref, $notes, $status, $actorId]);
            $recId = (int)$conn->insert_id;
            $data = ['id' => $recId, 'status' => $status, 'difference' => $diff, 'reconciled_at' => date('Y-m-d H:i:s')];
        }
        elseif($action==='save_bank'||$action==='create_bank'){
            $bankIdReq = !empty($body['id']) ? (int)$body['id'] : 0;
            $bName = trim($body['nama'] ?? $body['name'] ?? '');
            $bBank = trim($body['bank'] ?? $body['bank_name'] ?? 'Bank BCA');
            $bNo = trim($body['noRek'] ?? $body['account_number'] ?? '-');
            $bSaldo = (float)($body['saldo'] ?? $body['balance'] ?? 0);
            $bJenis = trim($body['jenis'] ?? 'Bank');
            $bStatus = (isset($body['status']) && (strtolower((string)$body['status']) === 'nonaktif' || (string)$body['status'] === '0' || $body['status'] === false)) ? 0 : 1;

            if(!$bName) ac_fail('Nama akun rekening wajib diisi.');
            if(!$bNo) $bNo = ($bJenis==='Tunai' ? 'CASH-01' : '-');

            $existingBank = null;
            if ($bankIdReq > 0) {
                $existingBank = ac_one($conn, "SELECT * FROM cash_bank_accounts WHERE id=?", [$bankIdReq]);
            }
            if (!$existingBank) {
                if ($bNo !== '-' && $bNo !== 'CASH-01') {
                    $existingBank = ac_one($conn, "SELECT * FROM cash_bank_accounts WHERE account_number=? LIMIT 1", [$bNo]);
                }
                if (!$existingBank) {
                    $existingBank = ac_one($conn, "SELECT * FROM cash_bank_accounts WHERE name=? LIMIT 1", [$bName]);
                }
            }

            $accId = null;
            $bankId = null;

            if ($existingBank) {
                $bankId = (int)$existingBank['id'];
                $accId = (int)$existingBank['account_id'];

                ac_query($conn, "UPDATE cash_bank_accounts SET name=?, bank_name=?, account_number=?, is_active=? WHERE id=?",
                    [$bName, $bBank, $bNo, $bStatus, $bankId]);

                if ($accId > 0) {
                    ac_query($conn, "UPDATE accounts SET name=?, is_active=? WHERE id=?",
                        [$bName, $bStatus, $accId]);
                }
            } else {
                $maxCodeRow = ac_one($conn, "SELECT MAX(code) AS max_code FROM accounts WHERE code LIKE '11%' AND LENGTH(code)=4");
                $nextCode = (!empty($maxCodeRow['max_code'])) ? (string)((int)$maxCodeRow['max_code'] + 1) : '1101';
                ac_query($conn, "INSERT INTO accounts (code, name, account_group, normal_balance, is_detail, is_active, report_class) VALUES (?, ?, 1, 'debit', 1, ?, 'cash')",
                    [$nextCode, $bName, $bStatus]);
                $accId = (int)$conn->insert_id;

                ac_query($conn, "INSERT INTO cash_bank_accounts (name, account_id, bank_name, account_number, is_active) VALUES (?, ?, ?, ?, ?)",
                    [$bName, $accId, $bBank, $bNo, $bStatus]);
                $bankId = (int)$conn->insert_id;
            }

            if (ac_table($conn, 'journal_entries') && ac_table($conn, 'journal_lines')) {
                $eqAcc = ac_one($conn, "SELECT id FROM accounts WHERE (code LIKE '310%' OR report_class='capital') AND id<>? ORDER BY code LIMIT 1", [$accId]);
                $eqId = $eqAcc ? (int)$eqAcc['id'] : null;
                if (!$eqId) {
                    ac_query($conn, "INSERT INTO accounts (code, name, account_group, normal_balance, is_detail, is_active, report_class) VALUES ('3100', 'Modal Disetor / Saldo Awal', 3, 'credit', 1, 1, 'capital')");
                    $eqId = (int)$conn->insert_id;
                }

                $curBalRow = ac_one($conn, "SELECT COALESCE(SUM(jl.debit - jl.credit), 0) AS balance FROM journal_lines jl JOIN journal_entries je ON je.id=jl.journal_entry_id WHERE jl.account_id=? AND je.status='posted'", [$accId]);
                $currentBal = (float)($curBalRow['balance'] ?? 0);
                $diff = round($bSaldo - $currentBal, 2);

                if (abs($diff) >= 0.01) {
                    $today = date('Y-m-d');
                    $periodMonth = date('Y-m');
                    ac_query($conn, "INSERT IGNORE INTO accounting_periods (month, status) VALUES (?, 'open')", [$periodMonth]);
                    $periodRow = ac_one($conn, "SELECT id FROM accounting_periods WHERE month=?", [$periodMonth]);
                    $periodId = (int)($periodRow['id'] ?? 1);
                    $actorId = (int)($actor['id'] ?? 1);
                    $diffAbs = abs($diff);
                    $entryNum = 'JRN-' . date('Y') . '-BNK' . str_pad((string)$bankId, 5, '0', STR_PAD_LEFT) . '-' . substr(str_shuffle('0123456789'), 0, 4);

                    $existingOpening = ac_one($conn, "SELECT id FROM journal_entries WHERE source_type='bank_opening' AND source_id=? AND event='opening_balance'", [(string)$bankId]);
                    if (!$existingOpening) {
                        $sourceType = 'bank_opening';
                        $sourceId = (string)$bankId;
                        $event = 'opening_balance';
                        $memo = 'Saldo Awal Rekening ' . $bName;
                    } else {
                        $sourceType = 'bank_opening';
                        $sourceId = (string)$bankId . '-' . time() . '-' . mt_rand(100, 999);
                        $event = 'balance_adjustment';
                        $memo = 'Penyesuaian Saldo Rekening ' . $bName . ' (dari Rp ' . number_format($currentBal, 0, ',', '.') . ' ke Rp ' . number_format($bSaldo, 0, ',', '.') . ')';
                    }

                    ac_query($conn, "INSERT INTO journal_entries (entry_date, period_id, source_type, source_id, event, description, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')",
                        [$today, $periodId, $sourceType, $sourceId, $event, $memo, $actorId]);
                    $jId = (int)$conn->insert_id;

                    if ($diff > 0) {
                        ac_query($conn, "INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, cash_flow_class) VALUES (?, ?, ?, 0, 'financing')",
                            [$jId, $accId, $diffAbs]);
                        ac_query($conn, "INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, cash_flow_class) VALUES (?, ?, 0, ?, 'noncash')",
                            [$jId, $eqId, $diffAbs]);
                    } else {
                        ac_query($conn, "INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, cash_flow_class) VALUES (?, ?, 0, ?, 'financing')",
                            [$jId, $accId, $diffAbs]);
                        ac_query($conn, "INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, cash_flow_class) VALUES (?, ?, ?, 0, 'noncash')",
                            [$jId, $eqId, $diffAbs]);
                    }

                    ac_query($conn, "UPDATE journal_entries SET number=?, status='posted', posted_at=NOW() WHERE id=?",
                        [$entryNum, $jId]);
                }
            }

            $data = ['id' => $bankId, 'name' => $bName, 'saldo' => $bSaldo, 'status' => $bStatus ? 'Aktif' : 'Nonaktif'];
        }
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
catch(Throwable $e){error_log('Accounting request '.$requestId.': '.get_class($e).' '.$e->getMessage());http_response_code(500);echo json_encode(['status'=>'error','message'=>$e->getMessage(),'request_id'=>$requestId,'error_class'=>get_class($e)]);}
