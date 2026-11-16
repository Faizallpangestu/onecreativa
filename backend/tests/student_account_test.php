<?php
// AKN-01 + REG-02: akun siswa otomatis dan secret webhook tanpa default. Isolated test DB only.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
[$host, $database] = (static function () {
    $DB_HOST = 'localhost'; $DB_NAME = 'one-creativa';
    $file = __DIR__.'/../config/db_env.php';
    if (is_file($file)) require $file;
    return [$DB_HOST, $DB_NAME];
})();
if (!in_array($host, ['localhost', '127.0.0.1', '::1'], true) || !preg_match('/(?:_dev|_test)$/D', $database)) {
    throw new RuntimeException('Student account tests require a local development/test database configuration.');
}
$_SERVER['HTTP_HOST'] = '127.0.0.1';
require_once __DIR__.'/../config/database.php';
require_once __DIR__.'/../services/student_account.php';

$checks = 0;
function sa_check(bool $ok, string $message): void {
    if (!$ok) throw new RuntimeException('FAILED: '.$message);
    $GLOBALS['checks']++;
    echo "PASS: $message\n";
}

// ── REG-02: secret webhook ──
putenv('CREATIVA_WEBHOOK_SECRET');
require_once __DIR__.'/../services/rpa_automation.php';
if (!defined('CREATIVA_WEBHOOK_SECRET')) {
    sa_check(rpa_get_secret() === '', 'Tanpa konfigurasi tidak ada secret default');
    sa_check(!rpa_secret_configured(), 'Secret dilaporkan belum dikonfigurasi');
    sa_check(!rpa_secret_matches('CREATIVA_SYNC_SECRET_2026'), 'Secret lama yang bocor ditolak');
    sa_check(!rpa_secret_matches(''), 'Secret kosong ditolak saat server belum dikonfigurasi');
}
putenv('CREATIVA_WEBHOOK_SECRET=unit-test-secret-123');
sa_check(rpa_secret_matches('unit-test-secret-123'), 'Secret yang benar diterima');
sa_check(rpa_secret_matches('  unit-test-secret-123  '), 'Spasi di tepi diabaikan');
sa_check(!rpa_secret_matches('unit-test-secret-12'), 'Secret yang salah ditolak');
sa_check(!rpa_secret_matches(null) && !rpa_secret_matches(['x']), 'Nilai non-string ditolak');
putenv('CREATIVA_WEBHOOK_SECRET');

// ── AKN-01: akun siswa ──
$original = ac_one($conn, 'SELECT DATABASE() AS name')['name'];
$testName = 'one_creativa_account_test_'.bin2hex(random_bytes(6));
$conn->query("CREATE DATABASE `$testName` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
$conn->select_db($testName);
try {
    $conn->query('CREATE TABLE roles(id TINYINT UNSIGNED PRIMARY KEY,name VARCHAR(50)) ENGINE=InnoDB');
    $conn->query('CREATE TABLE users(id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,email VARCHAR(191) NOT NULL UNIQUE,password_hash VARCHAR(255) NOT NULL,role_id TINYINT UNSIGNED NOT NULL,is_active TINYINT DEFAULT 1,last_login_at TIMESTAMP NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
    $conn->query('CREATE TABLE peserta_intensif(id INT AUTO_INCREMENT PRIMARY KEY,user_id INT NULL,nama_lengkap VARCHAR(255),email VARCHAR(255)) ENGINE=InnoDB');
    $conn->query('CREATE TABLE accounting_audit_logs(id BIGINT AUTO_INCREMENT PRIMARY KEY,entity_type VARCHAR(50),entity_id VARCHAR(100),action VARCHAR(50),actor_id INT,actor_name VARCHAR(255),details_json LONGTEXT,ip_address VARCHAR(50),hash_prev VARCHAR(64),hash_self VARCHAR(64),created_at DATETIME DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
    $conn->query("INSERT INTO roles VALUES(4,'super_admin'),(16,'peserta_intensif')");
    $conn->query("INSERT INTO users(id,email,password_hash,role_id) VALUES(1,'admin@test.invalid','x',4),(2,'dipakai@test.invalid','x',4)");
    $conn->query("INSERT INTO peserta_intensif(id,nama_lengkap,email) VALUES(1,'Siswa Baru','Siswa.Baru@Test.invalid'),(2,'Tanpa Email','-'),(3,'Email Bentrok','dipakai@test.invalid')");
    $actor = ['id' => 0, 'name' => 'Registration webhook'];

    $created = ac_atomic($conn, fn() => sa_provision($conn, $actor, 1));
    sa_check($created['status'] === 'created' && $created['user_id'] > 0, 'Siswa baru mendapat akun');
    $user = ac_one($conn, 'SELECT u.*,r.name AS role_name FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=?', [$created['user_id']]);
    sa_check($user['role_name'] === 'peserta_intensif' && (int)$user['is_active'] === 1, 'Akun ber-role peserta_intensif dan aktif');
    sa_check($user['email'] === 'siswa.baru@test.invalid', 'Email akun dinormalisasi lowercase');
    sa_check(password_verify($created['temporary_password'], $user['password_hash']), 'Password sementara cocok dengan hash');
    sa_check(!str_contains($user['password_hash'], $created['temporary_password']), 'Password tidak disimpan dalam bentuk asli');
    sa_check(strlen($created['temporary_password']) === 12, 'Password sementara 12 karakter');
    sa_check((int)ac_one($conn, 'SELECT user_id FROM peserta_intensif WHERE id=1')['user_id'] === $created['user_id'], 'peserta_intensif.user_id tertaut ke akun baru');

    $again = ac_atomic($conn, fn() => sa_provision($conn, $actor, 1));
    sa_check($again['status'] === 'existing' && $again['user_id'] === $created['user_id'] && !isset($again['temporary_password']), 'Replay tidak membuat akun kedua atau password baru');
    sa_check((int)ac_one($conn, 'SELECT COUNT(*) c FROM users')['c'] === 3, 'Total akun tetap satu per siswa');

    $noEmail = ac_atomic($conn, fn() => sa_provision($conn, $actor, 2));
    sa_check($noEmail['status'] === 'needs_review' && $noEmail['reason'] === 'missing_valid_email', 'Email tidak valid → needs_review');
    $clash = ac_atomic($conn, fn() => sa_provision($conn, $actor, 3));
    sa_check($clash['status'] === 'needs_review' && $clash['reason'] === 'email_already_registered', 'Email milik akun lain tidak ditautkan otomatis');
    sa_check(ac_one($conn, 'SELECT user_id FROM peserta_intensif WHERE id=3')['user_id'] === null, 'Siswa dengan email bentrok tetap tanpa akun');

    $rolledBack = null;
    try { ac_atomic($conn, function () use ($conn, $actor, &$rolledBack) { $conn->query("UPDATE peserta_intensif SET email='rollback@test.invalid' WHERE id=2"); $rolledBack = sa_provision($conn, $actor, 2); throw new RuntimeException('rollback'); }); } catch (RuntimeException $e) {}
    sa_check($rolledBack['status'] === 'created' && !ac_one($conn, "SELECT id FROM users WHERE email='rollback@test.invalid'"), 'Akun ikut di-rollback bila transaksi pendaftaran gagal');

    $public = sa_public($created);
    sa_check(!array_key_exists('temporary_password', $public), 'sa_public menghapus password dari respons');

    $delivered = sa_deliver($conn, $actor, $created);
    sa_check(in_array($delivered['delivery'], ['not_configured', 'sent', 'failed'], true), 'Status pengiriman kredensial tercatat: '.$delivered['delivery']);
    sa_check((bool)ac_one($conn, "SELECT id FROM accounting_audit_logs WHERE entity_type='student_account' AND entity_id='1' AND action='created'"), 'Pembuatan akun tercatat di audit log');
    sa_check(!ac_one($conn, 'SELECT id FROM accounting_audit_logs WHERE details_json LIKE ?', ['%'.$created['temporary_password'].'%']), 'Audit log tidak memuat password');

    $issued = sa_issue($conn, $actor, ['student_id' => 1, 'reset' => true]);
    $hash = ac_one($conn, 'SELECT password_hash FROM users WHERE id=?', [$created['user_id']])['password_hash'];
    sa_check($issued['status'] === 'reset' && !password_verify($created['temporary_password'], $hash), 'Reset mengganti password lama');
    try { sa_issue($conn, $actor, ['student_id' => 1]); $dup = false; } catch (AccountingException $e) { $dup = $e->getCode() === 409; }
    sa_check($dup, 'Buat akun ulang tanpa reset ditolak 409');
    $map = sa_status_map($conn, [1, 2, 3]);
    sa_check($map[1]['status'] === 'active' && $map[2]['status'] === 'none' && $map[3]['status'] === 'none', 'Status akun untuk daftar siswa benar');

    echo "PASS: $checks student account/secret checks.\n";
} finally {
    $conn->select_db($original);
    $conn->query("DROP DATABASE `$testName`");
}
