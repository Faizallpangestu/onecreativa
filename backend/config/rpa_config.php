<?php
/**
 * rpa_config.php
 * Konfigurasi Terpadu Midtrans Payment Gateway & n8n Automation RPA
 * Terhubung dengan backend/storage/rpa_settings.json untuk konfigurasi dinamis via Dashboard UI.
 */

if (!function_exists('rpa_settings_file_path')) {
    function rpa_settings_file_path(): string {
        $storageDir = __DIR__ . '/../storage';
        if (!is_dir($storageDir)) {
            @mkdir($storageDir, 0755, true);
        }
        return $storageDir . '/rpa_settings.json';
    }
}

if (!function_exists('rpa_load_stored_settings')) {
    function rpa_load_stored_settings(): array {
        $filePath = rpa_settings_file_path();
        if (is_file($filePath)) {
            $raw = @file_get_contents($filePath);
            if ($raw) {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    return $decoded;
                }
            }
        }
        return [];
    }
}

if (!function_exists('rpa_save_stored_settings')) {
    function rpa_save_stored_settings(array $newSettings): bool {
        $current = rpa_load_stored_settings();
        $merged = array_merge($current, $newSettings);
        $merged['updated_at'] = date('c');
        $filePath = rpa_settings_file_path();
        return (bool)@file_put_contents($filePath, json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }
}

// 1. Baca konfigurasi tersimpan dari storage/rpa_settings.json
$stored = rpa_load_stored_settings();

// 2. Baca file lokal lama jika ada (backward compatibility)
$localConfig = __DIR__ . '/rpa.local.php';
if (is_file($localConfig)) {
    @include_once $localConfig;
}

// 3. Terapkan konfigurasi Midtrans
$midtransServer = trim((string)($stored['midtrans_server_key'] ?? getenv('MIDTRANS_SERVER_KEY') ?: (defined('MIDTRANS_SERVER_KEY') ? MIDTRANS_SERVER_KEY : 'Mid-server-Ems6wximYeuQ-MhX.FSj46Qv')));
$midtransClient = trim((string)($stored['midtrans_client_key'] ?? getenv('MIDTRANS_CLIENT_KEY') ?: (defined('MIDTRANS_CLIENT_KEY') ? MIDTRANS_CLIENT_KEY : 'Mid-client-LILBagcdYUvoYqBx')));
$midtransMerchant = trim((string)($stored['midtrans_merchant_id'] ?? getenv('MIDTRANS_MERCHANT_ID') ?: (defined('MIDTRANS_MERCHANT_ID') ? MIDTRANS_MERCHANT_ID : '')));
$midtransIsProd = isset($stored['midtrans_is_production'])
    ? (bool)$stored['midtrans_is_production']
    : (getenv('MIDTRANS_IS_PRODUCTION') !== false ? in_array(strtolower(trim((string)getenv('MIDTRANS_IS_PRODUCTION'))), ['1', 'true', 'yes', 'on'], true) : (defined('MIDTRANS_IS_PRODUCTION') ? (bool)MIDTRANS_IS_PRODUCTION : true));

if (!defined('MIDTRANS_SERVER_KEY') && $midtransServer !== '') {
    define('MIDTRANS_SERVER_KEY', $midtransServer);
}
if (!defined('MIDTRANS_CLIENT_KEY') && $midtransClient !== '') {
    define('MIDTRANS_CLIENT_KEY', $midtransClient);
}
if (!defined('MIDTRANS_MERCHANT_ID') && $midtransMerchant !== '') {
    define('MIDTRANS_MERCHANT_ID', $midtransMerchant);
}
if (!defined('MIDTRANS_IS_PRODUCTION')) {
    define('MIDTRANS_IS_PRODUCTION', $midtransIsProd);
}

// 4. Terapkan konfigurasi n8n Webhook
$n8nUrl = trim((string)($stored['n8n_receipt_webhook_url'] ?? getenv('N8N_RECEIPT_WEBHOOK_URL') ?: (defined('N8N_RECEIPT_WEBHOOK_URL') ? N8N_RECEIPT_WEBHOOK_URL : '')));
if (!defined('N8N_RECEIPT_WEBHOOK_URL') && $n8nUrl !== '') {
    define('N8N_RECEIPT_WEBHOOK_URL', $n8nUrl);
}

// 5. Terapkan konfigurasi Shared Secret
$secret = trim((string)($stored['creativa_webhook_secret'] ?? getenv('CREATIVA_WEBHOOK_SECRET') ?: (defined('CREATIVA_WEBHOOK_SECRET') ? CREATIVA_WEBHOOK_SECRET : 'CREATIVA_SYNC_SECRET_2026')));
if (!defined('CREATIVA_WEBHOOK_SECRET')) {
    define('CREATIVA_WEBHOOK_SECRET', $secret ?: 'CREATIVA_SYNC_SECRET_2026');
}

// 6. Terapkan URL status publik
$statusBaseUrl = trim((string)($stored['creativa_public_status_base_url'] ?? getenv('CREATIVA_PUBLIC_STATUS_BASE_URL') ?: (defined('CREATIVA_PUBLIC_STATUS_BASE_URL') ? CREATIVA_PUBLIC_STATUS_BASE_URL : 'https://creativabridging.com/status-pendaftaran')));
if (!defined('CREATIVA_PUBLIC_STATUS_BASE_URL')) {
    define('CREATIVA_PUBLIC_STATUS_BASE_URL', $statusBaseUrl);
}

// 7. Terapkan konfigurasi WhatsApp Gateway (Fonnte & Wablas)
$fonnteToken = trim((string)($stored['fonnte_token'] ?? getenv('FONNTE_TOKEN') ?: (defined('FONNTE_TOKEN') ? FONNTE_TOKEN : '')));
if (!defined('FONNTE_TOKEN') && $fonnteToken !== '') {
    define('FONNTE_TOKEN', $fonnteToken);
}

$wablasToken = trim((string)($stored['wablas_token'] ?? getenv('WABLAS_TOKEN') ?: (defined('WABLAS_TOKEN') ? WABLAS_TOKEN : '')));
if (!defined('WABLAS_TOKEN') && $wablasToken !== '') {
    define('WABLAS_TOKEN', $wablasToken);
}

$wablasDomain = trim((string)($stored['wablas_domain'] ?? getenv('WABLAS_DOMAIN') ?: (defined('WABLAS_DOMAIN') ? WABLAS_DOMAIN : 'kudus.wablas.com')));
if (!defined('WABLAS_DOMAIN') && $wablasDomain !== '') {
    define('WABLAS_DOMAIN', $wablasDomain);
}

