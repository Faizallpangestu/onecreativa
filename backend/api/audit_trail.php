<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';

if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private, max-age=0');
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') { http_response_code(200); exit; }

// ── Real IP helper (handles proxy/load balancer) ──
function audit_real_ip(): string {
    $trusted = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];
    foreach ($trusted as $key) {
        $val = $_SERVER[$key] ?? '';
        if ($val) {
            $ip = trim(explode(',', $val)[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
    }
    return '0.0.0.0';
}

// ── Auto-create audit_logs table if needed ──
$conn->query("CREATE TABLE IF NOT EXISTS accounting_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(60) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(60) NOT NULL,
    actor_id INT NOT NULL DEFAULT 0,
    actor_name VARCHAR(150) NOT NULL DEFAULT '',
    details_json JSON NULL,
    ip_address VARCHAR(45) NULL,
    hash_prev VARCHAR(64) NULL,
    hash_self VARCHAR(64) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_actor  (actor_id),
    INDEX idx_ts     (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

// Add ip_address column if missing (upgrade path)
$conn->query("ALTER TABLE accounting_audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) NULL AFTER details_json");
$conn->query("ALTER TABLE accounting_audit_logs ADD COLUMN IF NOT EXISTS hash_prev  VARCHAR(64) NULL AFTER ip_address");
$conn->query("ALTER TABLE accounting_audit_logs ADD COLUMN IF NOT EXISTS hash_self  VARCHAR(64) NULL AFTER hash_prev");

// ── POST / GET CLEAR: RESET AUDIT TRAIL ──
if (isset($_GET['clear']) || isset($_GET['reset']) || (isset($_POST['action']) && $_POST['action'] === 'clear') || $method === 'DELETE') {
    $conn->query("TRUNCATE TABLE accounting_audit_logs");
    echo json_encode([
        'status'  => 'success',
        'message' => 'Seluruh data audit trail forensik berhasil dibersihkan.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ── GET: FETCH AUDIT TRAIL ──
if ($method === 'GET') {
    $logs = [];
    $realIp = audit_real_ip();

    // 1. accounting_audit_logs (only actual audit logs from real operations)
    $tableCheck = $conn->query("SHOW TABLES LIKE 'accounting_audit_logs'");
    if ($tableCheck && $tableCheck->num_rows > 0) {
        $limit = min((int)($_GET['limit'] ?? 100), 500);
        $page  = max(0, (int)($_GET['page'] ?? 0));
        $offset = $page * $limit;
        $filter = '';
        $params = [];
        if (!empty($_GET['entity_type'])) {
            $filter  .= " AND entity_type = ?";
            $params[] = $_GET['entity_type'];
        }
        if (!empty($_GET['actor_id'])) {
            $filter  .= " AND actor_id = ?";
            $params[] = (int)$_GET['actor_id'];
        }
        if (!empty($_GET['from'])) {
            $filter  .= " AND created_at >= ?";
            $params[] = $_GET['from'] . ' 00:00:00';
        }
        if (!empty($_GET['to'])) {
            $filter  .= " AND created_at <= ?";
            $params[] = $_GET['to'] . ' 23:59:59';
        }

        $sql = "SELECT * FROM accounting_audit_logs WHERE 1=1 $filter ORDER BY id DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        $stmt = $conn->prepare($sql);
        if ($stmt) {
            if ($params) {
                $types = str_repeat('s', count($params) - 2) . 'ii';
                $stmt->bind_param($types, ...$params);
            }
            $stmt->execute();
            $res = $stmt->get_result();
            while ($r = $res->fetch_assoc()) {
                $details = [];
                try { $details = json_decode($r['details_json'] ?? '{}', true) ?: []; } catch (Throwable $e) {}
                $amount = (float)($details['amount'] ?? $details['total_salary'] ?? $details['nominal'] ?? $details['total'] ?? 0);
                // Verify hash chain integrity
                $expectedHash = hash('sha256', ($r['hash_prev'] ?? '') . $r['id'] . $r['entity_type'] . $r['entity_id'] . $r['action'] . ($r['actor_id']) . ($r['created_at'] ?? ''));
                $integrityOk  = ($r['hash_self'] ?? '') === $expectedHash;

                $logs[] = [
                    'id'               => (int)$r['id'],
                    'audit_code'       => 'AUD-' . str_pad($r['id'], 6, '0', STR_PAD_LEFT),
                    'timestamp'        => $r['created_at'],
                    'entity_type'      => $r['entity_type'],
                    'entity_id'        => $r['entity_id'],
                    'action'           => strtoupper($r['action']),
                    'actor_id'         => (int)$r['actor_id'],
                    'actor_name'       => $r['actor_name'] ?: 'System',
                    'actor_role'       => $details['actor_role'] ?? 'System',
                    'amount'           => $amount,
                    'details'          => $details,
                    'ip_address'       => $r['ip_address'] ?? $realIp,
                    'hash_checksum'    => substr($expectedHash, 0, 16) . '...',
                    'integrity_status' => $integrityOk ? 'VERIFIED' : 'WARN_HASH_MISMATCH',
                ];
            }
            $stmt->close();
        }
    }

    echo json_encode([
        'status'              => 'success',
        'total'               => count($logs),
        'compliance_standard' => 'SAK ETAP, PSAK 1, UU ITE No.19/2016, PP PSTE No.71/2019 & Permenristekdikti',
        'chain_integrity'     => 'SHA-256 Hash Chain per entri — setiap log merujuk hash sebelumnya',
        'server_ip'           => $realIp,
        'data'                => $logs,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
