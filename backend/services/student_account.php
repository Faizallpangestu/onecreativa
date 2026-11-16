<?php
/**
 * AKN-01 — Akun login siswa otomatis.
 *
 * Alur (notulen 31 Okt 2026): pendaftaran disetujui → invoice terbit → akun siswa dibuat
 * → siswa login untuk upload bukti bayar secara mandiri.
 *
 * - sa_provision() dipanggil DI DALAM transaksi pendaftaran: membuat users(role peserta_intensif)
 *   dan menautkan peserta_intensif.user_id. Password sementara hanya ada di memori, tidak disimpan.
 * - sa_deliver() dipanggil SETELAH commit: mengirim kredensial via SMTP bersama.
 * - Kepemilikan tidak pernah ditetapkan lewat kecocokan email: bila email sudah dipakai akun lain,
 *   status menjadi needs_review dan admin yang memutuskan.
 */
require_once __DIR__.'/accounting_core.php';
require_once __DIR__.'/salary_mail.php';

const SA_ROLE = 'peserta_intensif';

function sa_role_id(mysqli $db): int {
    $role = ac_one($db, 'SELECT id FROM roles WHERE name=?', [SA_ROLE]);
    if (!$role) ac_fail('Role peserta_intensif belum terdaftar.', 409);
    return (int)$role['id'];
}

function sa_temp_password(): string {
    // Tanpa karakter ambigu (0/O, 1/l/I) agar mudah diketik dari email/WhatsApp.
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    $out = '';
    for ($i = 0; $i < 12; $i++) $out .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    return $out;
}

function sa_login_url(): string {
    $base = getenv('CREATIVA_APP_URL');
    if ($base === false || trim($base) === '') $base = 'https://one.creativabridging.com';
    return rtrim(trim($base), '/').'/login';
}

/** Hapus password sementara dari hasil sebelum dikirim ke log/respons integrasi. */
function sa_public(?array $account): ?array {
    if ($account === null) return null;
    unset($account['temporary_password']);
    return $account;
}

function sa_review(mysqli $db, array $actor, array $student, string $reason): array {
    ac_audit($db, $actor, 'student_account', (string)$student['id'], 'needs_review', ['reason' => $reason]);
    return ['status' => 'needs_review', 'reason' => $reason, 'student_id' => (int)$student['id'], 'user_id' => null];
}

/** Buat akun bila siswa belum punya. Wajib dipanggil di dalam transaksi pemanggil. */
function sa_provision(mysqli $db, array $actor, int $studentId): array {
    $student = ac_one($db, 'SELECT id,nama_lengkap,email,user_id FROM peserta_intensif WHERE id=? FOR UPDATE', [$studentId]);
    if (!$student) ac_fail('Siswa tidak ditemukan.', 404);
    if (!empty($student['user_id'])) {
        return ['status' => 'existing', 'student_id' => $studentId, 'user_id' => (int)$student['user_id']];
    }
    $email = strtolower(trim((string)($student['email'] ?? '')));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return sa_review($db, $actor, $student, 'missing_valid_email');
    if (ac_one($db, 'SELECT id FROM users WHERE LOWER(TRIM(email))=?', [$email])) return sa_review($db, $actor, $student, 'email_already_registered');

    $password = sa_temp_password();
    ac_query($db, 'INSERT INTO users(email,password_hash,role_id,is_active,created_at,updated_at) VALUES(?,?,?,1,NOW(),NOW())',
        [$email, password_hash($password, PASSWORD_DEFAULT), sa_role_id($db)]);
    $userId = (int)$db->insert_id;
    ac_query($db, 'UPDATE peserta_intensif SET user_id=? WHERE id=? AND user_id IS NULL', [$userId, $studentId]);
    ac_audit($db, $actor, 'student_account', (string)$studentId, 'created', ['user_id' => $userId]);
    return ['status' => 'created', 'student_id' => $studentId, 'user_id' => $userId, 'email' => $email,
        'name' => (string)$student['nama_lengkap'], 'temporary_password' => $password];
}

/** Ganti password akun siswa yang sudah ada dengan password sementara baru. Di dalam transaksi. */
function sa_reset(mysqli $db, array $actor, int $studentId): array {
    $row = ac_one($db, 'SELECT p.id,p.nama_lengkap,u.id AS user_id,u.email,r.name AS role_name FROM peserta_intensif p JOIN users u ON u.id=p.user_id LEFT JOIN roles r ON r.id=u.role_id WHERE p.id=? FOR UPDATE', [$studentId]);
    if (!$row) ac_fail('Siswa belum memiliki akun.', 404);
    if ($row['role_name'] !== SA_ROLE) ac_fail('Akun tertaut bukan akun siswa. Reset hanya lewat administrator akun.', 409);
    $password = sa_temp_password();
    ac_query($db, 'UPDATE users SET password_hash=?,is_active=1,updated_at=NOW() WHERE id=?', [password_hash($password, PASSWORD_DEFAULT), (int)$row['user_id']]);
    ac_audit($db, $actor, 'student_account', (string)$studentId, 'password_reset', ['user_id' => (int)$row['user_id']]);
    return ['status' => 'reset', 'student_id' => $studentId, 'user_id' => (int)$row['user_id'], 'email' => (string)$row['email'],
        'name' => (string)$row['nama_lengkap'], 'temporary_password' => $password];
}

function sa_mail_content(array $account): array {
    $name = htmlspecialchars($account['name'], ENT_QUOTES, 'UTF-8');
    $email = htmlspecialchars($account['email'], ENT_QUOTES, 'UTF-8');
    $password = htmlspecialchars($account['temporary_password'], ENT_QUOTES, 'UTF-8');
    $url = sa_login_url(); $safeUrl = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
    $html = "<p>Halo <b>$name</b>,</p><p>Akun siswa OneCreativa Anda sudah aktif. Gunakan akun ini untuk melihat tagihan dan mengunggah bukti pembayaran.</p>"
        ."<table cellpadding=\"6\"><tr><td>Login</td><td><a href=\"$safeUrl\">$safeUrl</a></td></tr><tr><td>Email</td><td><b>$email</b></td></tr><tr><td>Password sementara</td><td><b style=\"font-family:monospace\">$password</b></td></tr></table>"
        ."<p>Demi keamanan, segera ganti password setelah login pertama dan jangan bagikan password ini kepada siapa pun.</p><p>LPK Creativa Bridging International</p>";
    $plain = "Halo {$account['name']},\n\nAkun siswa OneCreativa Anda sudah aktif.\nLogin: $url\nEmail: {$account['email']}\nPassword sementara: {$account['temporary_password']}\n\nSegera ganti password setelah login pertama.\n\nLPK Creativa Bridging International\n";
    return ['subject' => 'Akun Siswa OneCreativa Anda', 'html' => $html, 'plain' => $plain];
}

/** Kirim kredensial setelah commit. Kegagalan email tidak membatalkan akun yang sudah dibuat. */
function sa_deliver(mysqli $db, array $actor, ?array $account): ?array {
    if ($account === null || !in_array($account['status'] ?? '', ['created', 'reset'], true)) return $account;
    $delivery = 'not_configured';
    $config = salary_mail_config();
    if (salary_mail_configured($config)) {
        try {
            $content = sa_mail_content($account);
            $mail = salary_mail_transport($config);
            $mail->addAddress($account['email'], $account['name']);
            $mail->Subject = $content['subject']; $mail->isHTML(true); $mail->Body = $content['html']; $mail->AltBody = $content['plain'];
            $mail->send();
            $delivery = 'sent';
        } catch (Throwable $e) {
            // Jangan log isi email/kredensial.
            $delivery = 'failed';
        }
    }
    try { ac_audit($db, $actor, 'student_account', (string)$account['student_id'], 'credentials_'.$delivery, ['user_id' => $account['user_id']]); } catch (Throwable $e) {}
    $account['delivery'] = $delivery;
    return $account;
}

/** Status akun untuk daftar siswa. */
function sa_status_map(mysqli $db, array $studentIds): array {
    $ids = array_values(array_filter(array_map('intval', $studentIds)));
    if (!$ids) return [];
    $rows = ac_rows($db, 'SELECT p.id,p.user_id,u.email,u.is_active,u.last_login_at,r.name AS role_name FROM peserta_intensif p LEFT JOIN users u ON u.id=p.user_id LEFT JOIN roles r ON r.id=u.role_id WHERE p.id IN ('.implode(',', $ids).')');
    $map = [];
    foreach ($rows as $r) {
        $map[(int)$r['id']] = !$r['user_id'] ? ['status' => 'none']
            : ['status' => ((int)$r['is_active'] === 1 && $r['role_name'] === SA_ROLE) ? 'active' : 'needs_review',
               'email' => $r['email'], 'last_login_at' => $r['last_login_at']];
    }
    return $map;
}

/**
 * Aksi admin/Finance: buat akun (bila belum ada) atau reset password, lalu kirim kredensial.
 * Bila email belum terkirim, password sementara dikembalikan SEKALI agar admin dapat menyerahkannya manual.
 */
function sa_issue(mysqli $db, array $actor, array $d): array {
    $studentId = ac_id($d['student_id'] ?? null, 'ID Siswa');
    $reset = !empty($d['reset']);
    $account = ac_atomic($db, function () use ($db, $actor, $studentId, $reset) {
        $row = ac_one($db, 'SELECT user_id FROM peserta_intensif WHERE id=? FOR UPDATE', [$studentId]);
        if (!$row) ac_fail('Siswa tidak ditemukan.', 404);
        if ($row['user_id'] && !$reset) ac_fail('Siswa sudah memiliki akun. Gunakan reset password untuk mengirim ulang kredensial.', 409);
        return $row['user_id'] ? sa_reset($db, $actor, $studentId) : sa_provision($db, $actor, $studentId);
    });
    $account = sa_deliver($db, $actor, $account);
    if (($account['delivery'] ?? '') === 'sent') unset($account['temporary_password']);
    return $account;
}
