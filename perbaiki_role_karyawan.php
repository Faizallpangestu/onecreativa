<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Perbaikan Role Karyawan & Sinkronisasi Hak Akses - ONE Creativa</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 30px; margin: 0; }
        .card { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); padding: 24px; }
        h1 { font-size: 20px; color: #0f172a; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
        .success { background: #dcfce7; border: 1px solid #86efac; color: #166534; padding: 12px 16px; border-radius: 8px; margin: 12px 0; font-size: 14px; }
        .info { background: #e0f2fe; border: 1px solid #7dd3fc; color: #075985; padding: 12px 16px; border-radius: 8px; margin: 12px 0; font-size: 14px; }
        .danger { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: 12px 16px; border-radius: 8px; margin: 12px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f1f5f9; font-weight: 600; color: #475569; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 9999px; font-weight: 600; font-size: 12px; }
        .badge-karyawan { background: #e0e7ff; color: #3730a3; }
        .badge-admin { background: #fef3c7; color: #92400e; }
        .btn { display: inline-block; background: #2563eb; color: #fff; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 20px; }
        .btn:hover { background: #1d4ed8; }
    </style>
</head>
<body>
<div class="card">
    <h1>Perbaikan Role Pengguna & Akses Karyawan - ONE Creativa</h1>
<?php
$dbConfigPath = __DIR__ . '/config/database.php';
if (!file_exists($dbConfigPath)) {
    $dbConfigPath = __DIR__ . '/backend/config/database.php';
}

if (!file_exists($dbConfigPath)) {
    echo "<div class='danger'>Konfigurasi database tidak ditemukan. Pastikan file diletakkan di root atau folder public_html.</div></div></body></html>";
    exit;
}

require_once $dbConfigPath;

if (!$conn || $conn->connect_error) {
    echo "<div class='danger'>Gagal terhubung ke database: " . htmlspecialchars($conn->connect_error ?? 'Unknown error') . "</div></div></body></html>";
    exit;
}

// 1. Pastikan role karyawan tersedia
$rCheck = $conn->query("SELECT id FROM roles WHERE name='karyawan' LIMIT 1");
$rRow = $rCheck ? $rCheck->fetch_assoc() : null;
if (!$rRow) {
    $conn->query("INSERT INTO roles (name, label) VALUES ('karyawan', 'Karyawan')");
    $karyawanRoleId = (int)$conn->insert_id;
    echo "<div class='info'>Role 'karyawan' baru dibuat dengan ID: $karyawanRoleId</div>";
} else {
    $karyawanRoleId = (int)$rRow['id'];
}

// 2. Cari akun Muhammad Faizal dan ubah role menjadi KARYAWAN
$faizalEmail = 'muhammadfaizal.mf10@gmail.com';
$uFaizal = $conn->query("SELECT id, email, role_id FROM users WHERE LOWER(email)='$faizalEmail' LIMIT 1")->fetch_assoc();

if ($uFaizal) {
    $faizalUid = (int)$uFaizal['id'];
    $conn->query("UPDATE users SET role_id=$karyawanRoleId, is_active=1 WHERE id=$faizalUid");
    
    // Pastikan profil karyawan di tabel employees terhubung
    $conn->query("UPDATE employees SET user_id=$faizalUid, full_name='Muhammad Faizal' WHERE employee_code='2260005' OR LOWER(full_name) LIKE '%faizal%' LIMIT 1");
    
    echo "<div class='success'>
        <b>Berhasil!</b> Akun <b>$faizalEmail</b> (ID: $faizalUid) telah disetel ke <b>Role: KARYAWAN (ID: $karyawanRoleId)</b>.<br>
        Terkoneksi ke data pegawai NIK: <b>2260005</b> (Muhammad Faizal).
    </div>";
} else {
    // Buat jika belum ada
    $pwd = password_hash('creativa2026', PASSWORD_DEFAULT);
    $conn->query("INSERT INTO users(email, password_hash, role_id, is_active, created_at, updated_at) VALUES('$faizalEmail', '$pwd', $karyawanRoleId, 1, NOW(), NOW())");
    $faizalUid = (int)$conn->insert_id;
    $conn->query("UPDATE employees SET user_id=$faizalUid WHERE employee_code='2260005' LIMIT 1");
    echo "<div class='success'>Akun Muhammad Faizal baru dibuat dengan Role: Karyawan.</div>";
}

// 3. Pastikan akun Super Admin Sistem terpisah
$adminCheck = $conn->query("SELECT id, role_id FROM users WHERE email='admin@onecreativa.com' LIMIT 1")->fetch_assoc();
$superAdminRole = $conn->query("SELECT id FROM roles WHERE name='super_admin' LIMIT 1")->fetch_assoc();
$superRoleId = $superAdminRole ? (int)$superAdminRole['id'] : 4;

if ($adminCheck) {
    $conn->query("UPDATE users SET role_id=$superRoleId, is_active=1 WHERE id=" . (int)$adminCheck['id']);
    echo "<div class='info'>Akun Super Admin Sistem (<code>admin@onecreativa.com</code>) dipastikan aktif dengan role Super Admin.</div>";
}

// 4. Tampilkan daftar pengguna & role saat ini
$users = $conn->query("
    SELECT u.id, u.email, r.name AS role_name, r.label AS role_label, e.employee_code, e.full_name, e.position, e.work_type
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    LEFT JOIN employees e ON e.user_id = u.id
    ORDER BY u.id ASC
");

echo "<h3>Status Akun Pengguna Saat Ini:</h3>";
echo "<table>
    <thead>
        <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Role</th>
            <th>Pegawai / NIK</th>
            <th>Posisi</th>
            <th>Tipe Kerja</th>
        </tr>
    </thead>
    <tbody>";

while ($row = $users->fetch_assoc()) {
    $badgeClass = ($row['role_name'] === 'karyawan') ? 'badge-karyawan' : 'badge-admin';
    echo "<tr>
        <td>" . htmlspecialchars($row['id']) . "</td>
        <td><b>" . htmlspecialchars($row['email']) . "</b></td>
        <td><span class='badge $badgeClass'>" . htmlspecialchars($row['role_name'] ?: 'Tanpa Role') . "</span></td>
        <td>" . htmlspecialchars(($row['full_name'] ? $row['full_name'] . ' (' . $row['employee_code'] . ')' : '-')) . "</td>
        <td>" . htmlspecialchars($row['position'] ?: '-') . "</td>
        <td>" . htmlspecialchars($row['work_type'] ?: '-') . "</td>
    </tr>";
}

echo "</tbody></table>";
?>
    <p style="margin-top: 24px;">
        <a href="/login" class="btn">Kembali ke Halaman Login</a>
    </p>
</div>
</body>
</html>
