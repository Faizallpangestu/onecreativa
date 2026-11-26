<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/session.php';
header('Content-Type: text/html; charset=utf-8');

$email = trim((string)($_GET['email'] ?? ''));
$time = (int)($_GET['time'] ?? 0);
$sig = trim((string)($_GET['sig'] ?? ''));
$redirect = trim((string)($_GET['redirect'] ?? '/invoice-penagihan'));

$secret = 'CreativaBridgingSecret2026';
$expectedSig = hash_hmac('sha256', $email . '|' . $time, $secret);

// Validasi waktu (toleransi 10 menit untuk clock skew)
$now = time();
$isTimeValid = ($time > 0 && abs($now - $time) < 600);
$isSigValid = hash_equals($expectedSig, $sig);

if (!$isSigValid || !$isTimeValid || $email === '') {
    // Jika gagal validasi SSO, arahkan ke login biasa
    header("Location: /login?error=" . urlencode("Sesi SSO tidak valid atau telah kedaluwarsa."));
    exit;
}

// Cari user di database One-creativa
$select = 'SELECT u.id, u.email, u.role_id, u.is_active, r.name AS role_name FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE LOWER(TRIM(u.email)) = LOWER(?) LIMIT 1';
$stmt = $conn->prepare($select);
$stmt->bind_param("s", $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user || (int)$user['is_active'] !== 1) {
    header("Location: /login?error=" . urlencode("Akun tidak ditemukan atau non-aktif."));
    exit;
}

// Ambil profil karyawan jika ada
$empStmt = $conn->prepare("SELECT id AS employee_id, full_name, gender, photo_url AS photo, employee_code, position FROM employees WHERE user_id = ? LIMIT 1");
$empStmt->bind_param("i", $user['id']);
$empStmt->execute();
$profile = $empStmt->get_result()->fetch_assoc();
$empStmt->close();

if ($profile) {
    $user += $profile;
} else {
    $user['employee_id'] = null;
    $user['full_name'] = ($user['role_name'] === 'mitra_telu') ? 'Mitra Telkom University' : $user['email'];
}
$user['name'] = $user['full_name'] ?: $user['email'];

// Buat sesi login
start_app_session();
session_regenerate_id(true);
$_SESSION['user_id'] = (int)$user['id'];
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

// Pastikan sanitasi sebelum disimpan di localStorage client
unset($user['password_hash']);
$userJson = json_encode($user, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$safeRedirect = (str_starts_with($redirect, '/') && !str_starts_with($redirect, '//')) ? $redirect : '/invoice-penagihan';
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Mengarahkan ke Dashboard...</title>
  <script>
    try {
      localStorage.setItem("user", <?php echo json_encode($userJson); ?>);
    } catch(e) {}
    window.location.replace(<?php echo json_encode($safeRedirect); ?>);
  </script>
</head>
<body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #fff;">
  <div style="text-align: center;">
    <p style="font-size: 16px; font-weight: bold;">Menghubungkan sesi Anda ke ONE Creativa...</p>
    <p style="font-size: 12px; opacity: 0.7;">Jika tidak diarahkan otomatis, <a href="<?php echo htmlspecialchars($safeRedirect); ?>" style="color: #38bdf8;">klik di sini</a>.</p>
  </div>
</body>
</html>
