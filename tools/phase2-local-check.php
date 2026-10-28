<?php
if(PHP_SAPI!=='cli')exit;
require_once __DIR__.'/../backend/config/database.php';require_once __DIR__.'/../backend/services/accounting_reports.php';
mysqli_report(MYSQLI_REPORT_ERROR|MYSQLI_REPORT_STRICT);$conn->query('START TRANSACTION READ ONLY');
try{$ledger=ac_ledger($conn,[]);$report=ac_reports($conn,[]);if($ledger['total']!==3||$report['coverage']['posted_journals']!==0||$report['coverage']['legacy_needs_review']!==3)throw new RuntimeException('Unexpected local coverage');
foreach($ledger['rows']as $row){$detail=ac_transaction_detail($conn,$row['ledger_id']);if(!$detail['legacy'])throw new RuntimeException('Historical data automatically converted');}
echo "PASS: real local ledger has 3 historical records, 0 posted journals, 3 review flags; details load without reclassification.\n";
}finally{$conn->rollback();}
