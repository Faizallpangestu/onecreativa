<?php
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
define('RUN_INVOICE_MAIL_TESTS',true);
require __DIR__.'/billing_invoice_test.php';
