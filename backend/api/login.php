<?php
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../config/session.php';
require_once __DIR__.'/../services/accounting_core.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') ac_fail('Method not allowed.', 405);

// ── Auto-create login audit table ──
$conn->query("CREATE TABLE IF NOT EXISTS login_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL DEFAULT 0,
    user_name VARCHAR(150) NOT NULL DEFAULT '',
    user_role VARCHAR(60) NOT NULL DEFAULT '',
    action ENUM('login','logout','login_failed') NOT NULL DEFAULT 'login',
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(300) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_ts (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

$d = json_decode(file_get_contents('php://input'), true);
if (!is_array($d) || !is_string($d['email'] ?? null) || !is_string($d['password'] ?? null) || strlen($d['email']) > 191 || strlen($d['password']) > 1024)
    ac_fail('Data login tidak valid.');

$identifier = trim($d['email']); $password = $d['password'];
$ip         = trim(explode(',', ($_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'))[0]);
$ua         = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 300);

$select = 'SELECT u.id,u.email,u.password_hash,u.role_id,u.is_active,r.name AS role_name FROM users u LEFT JOIN roles r ON r.id=u.role_id';
$rows   = ac_rows($conn, $select . ' WHERE LOWER(TRIM(u.email))=LOWER(?) LIMIT 2', [$identifier]);
if (!$rows) $rows = ac_rows($conn, $select . ' WHERE EXISTS(SELECT 1 FROM employees e WHERE e.user_id=u.id AND e.employee_code=?) LIMIT 2', [$identifier]);

$user   = count($rows) === 1 ? $rows[0] : null;
$legacy = $user && preg_match('/^[a-f0-9]{32}$/Di', $user['password_hash'] ?? '') && hash_equals(strtolower($user['password_hash']), md5($password));
$valid  = $user && $password !== '' && ($legacy || password_verify($password, $user['password_hash'] ?? ''));

if (!$valid) {
    // Log failed login attempt
    if ($user) {
        $conn->prepare("INSERT INTO login_audit_log(user_id,user_name,user_role,action,ip_address,user_agent) VALUES(?,?,?,'login_failed',?,?)")
             ->execute([(int)$user['id'], $user['email'], $user['role_name'] ?? '', $ip, $ua]);
    }
    ac_fail('Email atau password tidak valid.', 401);
}
if ((int)$user['is_active'] !== 1) ac_fail('Akun Anda nonaktif atau aksesnya telah dicabut. Hubungi admin untuk memeriksa status akun.', 401);
if (!$user['role_name']) ac_fail('Hak akses akun belum terhubung. Hubungi admin untuk memperbaiki role akun.', 403);

$profiles = ac_rows($conn, 'SELECT id AS employee_id,full_name,gender,photo_url AS photo,employee_code,position FROM employees WHERE user_id=? LIMIT 2', [(int)$user['id']]);
if (count($profiles) > 1) ac_fail('Profil karyawan terhubung lebih dari satu kali. Hubungi admin untuk memeriksa relasi akun.', 409);
$user += ($profiles[0] ?? ['employee_id' => null, 'full_name' => null]);
if ($legacy || password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT))
    ac_query($conn, 'UPDATE users SET password_hash=? WHERE id=? AND password_hash=?', [password_hash($password, PASSWORD_DEFAULT), (int)$user['id'], $user['password_hash']]);

start_app_session();
session_regenerate_id(true);
$_SESSION = ['user_id' => (int)$user['id'], 'csrf_token' => bin2hex(random_bytes(32))];

// ── Log successful login ──
$conn->prepare("INSERT INTO login_audit_log(user_id,user_name,user_role,action,ip_address,user_agent) VALUES(?,?,?,'login',?,?)")
     ->execute([(int)$user['id'], $user['email'], $user['role_name'] ?? '', $ip, $ua]);

// Also log to accounting_audit_logs if it exists (for complete audit trail in finance)
$auditCheck = $conn->query("SHOW TABLES LIKE 'accounting_audit_logs'");
if ($auditCheck && $auditCheck->num_rows > 0) {
    $prevRow  = $conn->query("SELECT hash_self FROM accounting_audit_logs ORDER BY id DESC LIMIT 1")?->fetch_assoc();
    $prevHash = $prevRow['hash_self'] ?? '';
    $details  = json_encode(['user_role' => $user['role_name'], 'ip' => $ip, 'actor_role' => $user['role_name']], JSON_UNESCAPED_UNICODE);
    $stmt = $conn->prepare("INSERT INTO accounting_audit_logs(entity_type,entity_id,action,actor_id,actor_name,details_json,ip_address,hash_prev) VALUES('auth',?,?,?,?,?,?,?)");
    $eid  = 'USER-' . (int)$user['id'];
    $stmt->execute([$eid, 'LOGIN', (int)$user['id'], $user['email'], $details, $ip, $prevHash]);
    $logId    = (int)$conn->insert_id;
    $selfHash = hash('sha256', $prevHash . $logId . 'auth' . $eid . 'LOGIN' . $user['id'] . date('Y-m-d H:i:s'));
    $conn->query("UPDATE accounting_audit_logs SET hash_self='$selfHash' WHERE id=$logId");
    $stmt->close();
}

unset($user['password_hash']);
$user['name'] = $user['full_name'] ?: $user['email'];
echo json_encode(['status' => 'success', 'message' => 'Login berhasil', 'user' => $user]);
