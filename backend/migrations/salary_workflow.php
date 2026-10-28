<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../services/salary_schema.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
install_salary_schema($conn);
echo "Salary workflow schema installed.\n";
