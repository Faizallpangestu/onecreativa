<?php
require 'c:/Muhammadfaizal/htdocs/One-creativa/backend/config/database.php';
require 'c:/Muhammadfaizal/htdocs/One-creativa/backend/services/rpa_automation.php';

$toEmail = 'Muhammadfaizal.mf10@gmail.com';
$toName = 'Muhammad Faizal';
$subject = '[TEST HOSTINGER SMTP] Invoice Test TGCJ26110002';
$htmlBody = '<h1>Test Pengiriman Invoice</h1><p>Ini adalah email uji coba invoice TGCJ26110002.</p>';

echo "Testing SMTP send to $toEmail...\n";
$res = rpa_send_smtp_email($toEmail, $toName, $subject, $htmlBody);
var_dump($res);

