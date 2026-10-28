<?php
// Run once with PHP CLI on each installation; never import browser-only legacy data automatically.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../config/database.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
require_once __DIR__ . '/../services/budget_schema.php';
install_budget_schema($conn);
echo "RAB schema installed.\n";
