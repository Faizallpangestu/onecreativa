<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
define('RUN_RECEIPT_TESTS',true);
require __DIR__.'/invoice_mail_test.php';
