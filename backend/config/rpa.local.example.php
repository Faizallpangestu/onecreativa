<?php
/**
 * Salin file ini menjadi `rpa.local.php` di folder `config/` pada server production (Hostinger),
 * lalu isi URL webhook n8n Anda. File `rpa.local.php` otomatis diabaikan saat build/deploy
 * sehingga tidak akan tertimpa oleh rilis berikutnya.
 */

define('N8N_RECEIPT_WEBHOOK_URL', 'https://n8n.domain-anda.com/webhook/creativa-phase2-receipt');
// WAJIB diisi. Tanpa nilai ini semua endpoint berbasis secret menolak akses (fail closed).
// Buat secret acak, mis.: php -r "echo bin2hex(random_bytes(32));"
define('CREATIVA_WEBHOOK_SECRET', '');
// Opsional: API key endpoint creativabridging.com/api_peserta.php (default memakai CREATIVA_WEBHOOK_SECRET).
define('CREATIVABRIDGING_API_KEY', '');
define('CREATIVA_PUBLIC_STATUS_BASE_URL', 'https://creativabridging.com/status-pendaftaran');

// RPA Fase 3: Midtrans Payment Gateway (QRIS & Virtual Account Auto-Reconcile)
// Isi dengan Server Key & Client Key dari Midtrans Dashboard (Sandbox terlebih dahulu untuk testing, lalu Production).
define('MIDTRANS_SERVER_KEY', 'SB-Mid-server-YOUR_SERVER_KEY');
define('MIDTRANS_CLIENT_KEY', 'SB-Mid-client-YOUR_CLIENT_KEY');
define('MIDTRANS_IS_PRODUCTION', false);

