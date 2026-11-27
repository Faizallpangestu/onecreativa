<?php
/**
 * Salin file ini menjadi `config.rpa.local.php` di folder `api/` pada server production creativabridging.com.
 * File `config.rpa.local.php` tidak ikut ter-overwrite saat deploy build berikutnya.
 */

define('N8N_INVOICE_WEBHOOK_URL', 'https://n8n.domain-anda.com/webhook/creativa-phase1-invoice');
define('ONE_CREATIVA_WEBHOOK_URL', 'https://one.creativabridging.com/api/webhook_registration.php');
define('ONE_CREATIVA_MIDTRANS_WEBHOOK_URL', 'https://one.creativabridging.com/api/midtrans_webhook.php');
define('ONE_CREATIVA_WEBHOOK_SECRET', 'CREATIVA_SYNC_SECRET_2026');

