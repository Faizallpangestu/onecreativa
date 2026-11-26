<?php
/**
 * rpa_config.php (API)
 * Mengelola konfigurasi Midtrans Payment Gateway & n8n Automation RPA
 * secara aman dari Dashboard UI One-Creativa.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/rpa_config.php';
require_once __DIR__ . '/../services/api_session_guard.php';
require_once __DIR__ . '/../services/rpa_automation.php';

function rpa_cfg_respond(int $code, array $payload): void {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$actor = api_session_guard($conn, $_SERVER['REQUEST_METHOD'] === 'GET' ? 'read' : 'prepare');
$userRole = strtolower(trim((string)($actor['role'] ?? '')));
$allowedRoles = ['admin', 'superadmin', 'administrator', 'finance', 'financelpk', 'mitra_telu'];

if (!in_array($userRole, $allowedRoles, true)) {
    rpa_cfg_respond(403, ['status' => 'error', 'message' => 'Hanya Admin atau Tim Finance yang berhak mengubah konfigurasi ini.']);
}

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = trim((string)($_SERVER['HTTP_HOST'] ?? 'one.creativabridging.com'));
$midtransWebhookUrl = "{$scheme}://{$host}/api/midtrans_webhook.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stored = rpa_load_stored_settings();
    $mtCfg = rpa_get_midtrans_config();
    $rawServer = $mtCfg['server_key'];
    
    $maskedServer = '';
    if ($rawServer !== '') {
        $len = strlen($rawServer);
        if ($len > 8) {
            $maskedServer = substr($rawServer, 0, 8) . str_repeat('*', max(4, $len - 12)) . substr($rawServer, -4);
        } else {
            $maskedServer = '********';
        }
    }

    $n8nUrl = rpa_get_receipt_webhook_url();
    $rawFonnte = defined('FONNTE_TOKEN') ? (string)FONNTE_TOKEN : (string)($stored['fonnte_token'] ?? '');
    $maskedFonnte = '';
    if ($rawFonnte !== '') {
        $len = strlen($rawFonnte);
        $maskedFonnte = $len > 6 ? substr($rawFonnte, 0, 4) . str_repeat('*', max(4, $len - 8)) . substr($rawFonnte, -4) : '********';
    }

    $rawWablas = defined('WABLAS_TOKEN') ? (string)WABLAS_TOKEN : (string)($stored['wablas_token'] ?? '');
    $maskedWablas = '';
    if ($rawWablas !== '') {
        $len = strlen($rawWablas);
        $maskedWablas = $len > 6 ? substr($rawWablas, 0, 4) . str_repeat('*', max(4, $len - 8)) . substr($rawWablas, -4) : '********';
    }

    rpa_cfg_respond(200, [
        'status' => 'success',
        'data' => [
            'midtrans_enabled' => $mtCfg['is_configured'],
            'midtrans_is_production' => $mtCfg['is_production'],
            'midtrans_server_key_masked' => $maskedServer,
            'midtrans_has_server_key' => $rawServer !== '',
            'midtrans_client_key' => $mtCfg['client_key'],
            'midtrans_merchant_id' => defined('MIDTRANS_MERCHANT_ID') ? (string)MIDTRANS_MERCHANT_ID : (string)($stored['midtrans_merchant_id'] ?? ''),
            'midtrans_webhook_url' => $midtransWebhookUrl,
            'n8n_receipt_webhook_url' => $n8nUrl,
            'n8n_receipt_configured' => $n8nUrl !== '',
            'fonnte_token_masked' => $maskedFonnte,
            'fonnte_has_token' => $rawFonnte !== '',
            'wablas_token_masked' => $maskedWablas,
            'wablas_has_token' => $rawWablas !== '',
            'wablas_domain' => defined('WABLAS_DOMAIN') ? (string)WABLAS_DOMAIN : (string)($stored['wablas_domain'] ?? 'kudus.wablas.com'),
            'wa_gateway_ready' => $rawFonnte !== '' || $rawWablas !== '',
        ]
    ]);
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $body = $raw ? (json_decode($raw, true) ?: []) : [];
    if (!empty($_POST)) {
        $body = array_merge($body, $_POST);
    }

    $action = trim((string)($body['action'] ?? $_GET['action'] ?? 'save'));

    // UJI KONEKSI MIDTRANS
    if ($action === 'test_midtrans') {
        $serverKey = trim((string)($body['midtrans_server_key'] ?? ''));
        $isProd = !empty($body['midtrans_is_production']);

        if ($serverKey === '' || str_contains($serverKey, '*')) {
            $currentCfg = rpa_get_midtrans_config();
            $serverKey = $currentCfg['server_key'];
        }

        if ($serverKey === '') {
            rpa_cfg_respond(400, ['status' => 'error', 'message' => 'Server Key Midtrans belum diisi.']);
        }

        $snapApi = $isProd
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        $testPayload = [
            'transaction_details' => [
                'order_id' => 'PING_' . time(),
                'gross_amount' => 10000
            ],
            'customer_details' => [
                'first_name' => 'Ping Test',
                'email' => 'ping@creativabridging.com'
            ]
        ];

        $ch = curl_init($snapApi);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json',
                'Authorization: Basic ' . base64_encode($serverKey . ':')
            ],
            CURLOPT_POSTFIELDS => json_encode($testPayload)
        ]);
        $resp = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $json = $resp ? json_decode($resp, true) : null;
        if ($httpCode === 401 || $httpCode === 403) {
            rpa_cfg_respond(400, [
                'status' => 'error',
                'message' => 'Koneksi Midtrans GAGAL: Server Key tidak memiliki izin atau salah environment (' . ($isProd ? 'Production' : 'Sandbox') . ').',
                'details' => $json
            ]);
        }

        if ($httpCode === 201 || $httpCode === 200 || !empty($json['token'])) {
            rpa_cfg_respond(200, [
                'status' => 'success',
                'message' => 'Koneksi Midtrans BERHASIL! Snap Token aktif untuk environment ' . ($isProd ? 'Production (Live)' : 'Sandbox (Uji Coba)') . '.',
            ]);
        }

        rpa_cfg_respond(200, [
            'status' => 'success',
            'message' => "Terhubung ke Midtrans API (HTTP {$httpCode}).",
            'details' => $json
        ]);
    }

    // UJI KONEKSI N8N
    if ($action === 'test_n8n') {
        $n8nUrl = trim((string)($body['n8n_receipt_webhook_url'] ?? ''));
        if ($n8nUrl === '') {
            $n8nUrl = rpa_get_receipt_webhook_url();
        }

        if ($n8nUrl === '') {
            rpa_cfg_respond(400, ['status' => 'error', 'message' => 'URL Webhook n8n belum diisi.']);
        }

        $dispatch = rpa_dispatch_webhook($n8nUrl, [
            'event' => 'ping_test',
            'sender' => 'One-Creativa ERP',
            'timestamp' => date('c'),
            'message' => 'Uji koneksi webhook receipt n8n Fase 2 dari One-Creativa.'
        ], rpa_get_secret(), 5);

        if (!empty($dispatch['sent'])) {
            rpa_cfg_respond(200, [
                'status' => 'success',
                'message' => 'Webhook n8n TERHUBUNG! Menerima respons HTTP ' . ($dispatch['http_code'] ?? 200) . '.',
            ]);
        }

        rpa_cfg_respond(400, [
            'status' => 'error',
            'message' => 'Gagal menghubungi webhook n8n: ' . ($dispatch['error'] ?? 'HTTP ' . ($dispatch['http_code'] ?? 'Unknown')),
        ]);
    }

    // UJI KONEKSI WHATSAPP (FONNTE / WABLAS)
    if ($action === 'test_wa') {
        $provider = trim((string)($body['wa_provider'] ?? 'fonnte'));
        $targetPhone = trim((string)($body['test_phone'] ?? ''));
        $cleanPhone = rpa_format_wa_phone($targetPhone);

        $stored = rpa_load_stored_settings();
        $fonnteToken = trim((string)($body['fonnte_token'] ?? ''));
        if ($fonnteToken === '' || str_contains($fonnteToken, '*')) {
            $fonnteToken = (string)($stored['fonnte_token'] ?? (defined('FONNTE_TOKEN') ? FONNTE_TOKEN : ''));
        }

        if ($provider === 'fonnte') {
            if ($fonnteToken === '') {
                rpa_cfg_respond(400, ['status' => 'error', 'message' => 'Token Fonnte belum diisi.']);
            }
            // Check device status
            $ch = curl_init("https://api.fonnte.com/device");
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 6,
                CURLOPT_HTTPHEADER => ['Authorization: ' . $fonnteToken],
            ]);
            $res = curl_exec($ch);
            $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            $parsed = json_decode((string)$res, true);

            if ($code >= 200 && $code < 300 && !empty($parsed['status'])) {
                $devStatus = $parsed['device_status'] ?? ($parsed['status'] ? 'Connected' : 'Disconnected');
                $devName = $parsed['device'] ?? $parsed['name'] ?? 'WhatsApp';
                rpa_cfg_respond(200, [
                    'status' => 'success',
                    'message' => "Fonnte Gateway TERHUBUNG! Device: {$devName} (Status: {$devStatus}). WhatsApp otomatis siap 24/7.",
                    'data' => $parsed
                ]);
            } else {
                $err = $parsed['reason'] ?? $parsed['message'] ?? 'Token tidak valid atau device belum terhubung di Fonnte.';
                rpa_cfg_respond(400, [
                    'status' => 'error',
                    'message' => 'Fonnte Gateway gagal: ' . $err
                ]);
            }
        }
    }

    // SIMPAN KONFIGURASI
    $stored = rpa_load_stored_settings();

    $newServerKey = trim((string)($body['midtrans_server_key'] ?? ''));
    if ($newServerKey !== '' && !str_contains($newServerKey, '*')) {
        $stored['midtrans_server_key'] = $newServerKey;
    }

    if (isset($body['midtrans_client_key'])) {
        $stored['midtrans_client_key'] = trim((string)$body['midtrans_client_key']);
    }

    if (isset($body['midtrans_merchant_id'])) {
        $stored['midtrans_merchant_id'] = trim((string)$body['midtrans_merchant_id']);
    }

    if (isset($body['midtrans_is_production'])) {
        $stored['midtrans_is_production'] = (bool)$body['midtrans_is_production'];
    }

    if (isset($body['n8n_receipt_webhook_url'])) {
        $stored['n8n_receipt_webhook_url'] = trim((string)$body['n8n_receipt_webhook_url']);
    }

    $newFonnte = trim((string)($body['fonnte_token'] ?? ''));
    if ($newFonnte !== '' && !str_contains($newFonnte, '*')) {
        $stored['fonnte_token'] = $newFonnte;
    } elseif ($newFonnte === '' && isset($body['fonnte_token'])) {
        $stored['fonnte_token'] = '';
    }

    $newWablas = trim((string)($body['wablas_token'] ?? ''));
    if ($newWablas !== '' && !str_contains($newWablas, '*')) {
        $stored['wablas_token'] = $newWablas;
    }

    if (isset($body['wablas_domain'])) {
        $stored['wablas_domain'] = trim((string)$body['wablas_domain']);
    }

    $ok = rpa_save_stored_settings($stored);
    if (!$ok) {
        rpa_cfg_respond(500, ['status' => 'error', 'message' => 'Gagal menyimpan file konfigurasi. Periksa izin tulis folder backend/storage.']);
    }

    rpa_cfg_respond(200, [
        'status' => 'success',
        'message' => 'Konfigurasi Midtrans Gateway, n8n, dan WhatsApp Bot berhasil disimpan!',
        'data' => [
            'midtrans_enabled' => !empty($stored['midtrans_server_key']),
            'midtrans_is_production' => !empty($stored['midtrans_is_production']),
            'n8n_receipt_configured' => !empty($stored['n8n_receipt_webhook_url']),
            'wa_gateway_ready' => !empty($stored['fonnte_token']) || !empty($stored['wablas_token']),
        ]
    ]);
}

rpa_cfg_respond(405, ['status' => 'error', 'message' => 'Metode HTTP tidak didukung.']);

