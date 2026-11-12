<?php
/**
 * Salin file ini menjadi `rpa.local.php` di folder `config/` pada server production (Hostinger),
 * lalu isi URL webhook n8n Anda. File `rpa.local.php` otomatis diabaikan saat build/deploy
 * sehingga tidak akan tertimpa oleh rilis berikutnya.
 */

define('N8N_RECEIPT_WEBHOOK_URL', 'https://n8n.domain-anda.com/webhook/creativa-phase2-receipt');
define('CREATIVA_WEBHOOK_SECRET', 'CREATIVA_SYNC_SECRET_2026');
define('CREATIVA_PUBLIC_STATUS_BASE_URL', 'https://creativabridging.com/status-pendaftaran');

// RPA Fase 3: Midtrans Payment Gateway (QRIS & Virtual Account Auto-Reconcile)
// Isi dengan Server Key & Client Key dari Midtrans Dashboard (Sandbox terlebih dahulu untuk testing, lalu Production).
define('MIDTRANS_SERVER_KEY', 'SB-Mid-server-YOUR_SERVER_KEY');
define('MIDTRANS_CLIENT_KEY', 'SB-Mid-client-YOUR_CLIENT_KEY');
define('MIDTRANS_IS_PRODUCTION', false);

