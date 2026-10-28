<?php
if (PHP_SAPI!=='cli') { http_response_code(404); exit; }
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/accounting_schema.php';
mysqli_report(MYSQLI_REPORT_ERROR|MYSQLI_REPORT_STRICT);
if (in_array('--dry-run',$argv,true)) {
    echo "Add accounting masters/journals/transactions/source documents/allocations and RAB realization tables.\nExpand RAB status; add nullable department/approved amount. No historical posting or deletion.\nRequires existing budget schema and InnoDB; backup database and storage first.\n"; exit;
}
install_accounting_schema($conn);
echo "Finance traceability v1 installed; historical transactions remain unchanged and unposted.\n";
