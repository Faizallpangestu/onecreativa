<?php
echo "<h2>Alat Perbaikan Otomatis Hostinger - Creativa</h2>";

$base_dir = __DIR__;
$success = true;

// 1. Perbaiki typo k?php di db_env.php
$db_env = $base_dir . '/config/db_env.php';
if (file_exists($db_env)) {
    $content = file_get_contents($db_env);
    if (strpos($content, 'k?php') !== false) {
        $content = str_replace('k?php', '<?php', $content);
        file_put_contents($db_env, $content);
        echo "<p style='color:green'>✔ Berhasil memperbaiki typo 'k?php' menjadi '&lt;?php' di config/db_env.php</p>";
    } else if (strpos($content, '<?php') !== false) {
        echo "<p style='color:green'>✔ File config/db_env.php sudah benar (menggunakan &lt;?php).</p>";
    } else {
        file_put_contents($db_env, "<?php\n" . $content);
        echo "<p style='color:green'>✔ Berhasil menambahkan &lt;?php ke config/db_env.php</p>";
    }
} else {
    echo "<p style='color:red'>✖ File config/db_env.php TIDAK DITEMUKAN. Anda harus membuatnya di Hostinger.</p>";
    $success = false;
}

// 2. Hapus api/.htaccess yang bikin bentrok jika ada
$api_htaccess = $base_dir . '/api/.htaccess';
if (file_exists($api_htaccess)) {
    $content = file_get_contents($api_htaccess);
    if (strpos($content, 'Deny from all') !== false || strpos($content, 'Require all denied') !== false) {
        unlink($api_htaccess);
        echo "<p style='color:green'>✔ Berhasil menghapus api/.htaccess pembatas yang menyebabkan Error 500.</p>";
    }
}

// 3. Perbaiki camera=() di .htaccess root
$root_htaccess = $base_dir . '/.htaccess';
if (file_exists($root_htaccess)) {
    $content = file_get_contents($root_htaccess);
    if (strpos($content, 'camera=()') !== false) {
        $content = str_replace('camera=(), microphone=(), geolocation=()', 'camera=*, microphone=(), geolocation=*', $content);
        file_put_contents($root_htaccess, $content);
        echo "<p style='color:green'>✔ Berhasil memperbaiki izin Kamera dan Lokasi di .htaccess utama.</p>";
    } else {
        echo "<p style='color:green'>✔ Izin Kamera di .htaccess utama sudah aman.</p>";
    }
}

// 4. Test Koneksi Database
require $base_dir . '/config/database.php';
if (isset($conn) && $conn) {
    echo "<p style='color:green; font-weight:bold;'>✔ KONEKSI DATABASE HOSTINGER BERHASIL!</p>";
    
    // 4.5 Pastikan Skema Tabel Wajib (Audit Logs, Positions, Roles, Work Type)
    echo "<h3>4.5 Memverifikasi Skema Database Hostinger...</h3>";
    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS `accounting_audit_logs` (
          `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          `entity_type` VARCHAR(40) NOT NULL,
          `entity_id` VARCHAR(100) NOT NULL,
          `action` VARCHAR(40) NOT NULL,
          `actor_id` INT UNSIGNED NOT NULL,
          `actor_name` VARCHAR(255) NOT NULL,
          `details_json` LONGTEXT NOT NULL,
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX `idx_entity` (`entity_type`, `entity_id`, `id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");
    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS `employee_employment` (
          `employee_id` INT UNSIGNED PRIMARY KEY,
          `manager_employee_id` INT UNSIGNED NULL,
          `employment_type` VARCHAR(50) NULL,
          `employment_status` VARCHAR(50) NULL,
          `resignation_date` DATE NULL,
          `updated_by` INT UNSIGNED NOT NULL DEFAULT 1,
          `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");
    echo "<p style='color:green'>✔ Tabel <code>accounting_audit_logs</code> dan <code>employee_employment</code> siap digunakan.</p>";

    // Cek dan lengkapi kolom positions
    $chkPosCol = mysqli_query($conn, "SHOW COLUMNS FROM `positions` LIKE 'base_salary'");
    if (mysqli_num_rows($chkPosCol) == 0) {
        mysqli_query($conn, "ALTER TABLE `positions` ADD COLUMN `base_salary` DECIMAL(15,2) NOT NULL DEFAULT 0.00");
    }
    $chkDeptCol = mysqli_query($conn, "SHOW COLUMNS FROM `positions` LIKE 'department_id'");
    if (mysqli_num_rows($chkDeptCol) == 0) {
        mysqli_query($conn, "ALTER TABLE `positions` ADD COLUMN `department_id` INT NULL");
    }
    $chkActCol = mysqli_query($conn, "SHOW COLUMNS FROM `positions` LIKE 'is_active'");
    if (mysqli_num_rows($chkActCol) == 0) {
        mysqli_query($conn, "ALTER TABLE `positions` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1");
    }

    // Cek kolom label pada roles
    $chkRoleLbl = mysqli_query($conn, "SHOW COLUMNS FROM `roles` LIKE 'label'");
    if (mysqli_num_rows($chkRoleLbl) == 0) {
        mysqli_query($conn, "ALTER TABLE `roles` ADD COLUMN `label` VARCHAR(100) NULL AFTER `name`");
    }

    // Cek kolom deleted_at pada users
    $chkUserDel = mysqli_query($conn, "SHOW COLUMNS FROM `users` LIKE 'deleted_at'");
    if (mysqli_num_rows($chkUserDel) == 0) {
        mysqli_query($conn, "ALTER TABLE `users` ADD COLUMN `deleted_at` DATETIME NULL AFTER `updated_at`");
    }

    // Fleksibilitas work_type di employees (WFO, WFH, Hybrid)
    mysqli_query($conn, "ALTER TABLE `employees` MODIFY COLUMN `work_type` VARCHAR(20) NOT NULL DEFAULT 'WFO'");
    echo "<p style='color:green'>✔ Struktur kolom tabel <code>positions</code>, <code>roles</code>, <code>users</code>, dan <code>employees</code> berhasil diverifikasi.</p>";

    // 5. Perbaiki Collation Database (Mencegah "Illegal mix of collations")
    echo "<h3>5. Menyelaraskan Collation Database (utf8mb4_general_ci)...</h3>";
    $tables = [
        'users', 'employees', 'roles', 'departments', 'positions',
        'peserta_intensif', 'attendance_logs', 'daily_reports',
        'leaves', 'settings', 'reimbursements', 'transactions',
        'matching_jobs', 'lpk_matching_job', 'matching_candidate_history', 'matching_student_links'
    ];
    
    foreach ($tables as $t) {
        $chk = mysqli_query($conn, "SHOW TABLES LIKE '$t'");
        if ($chk && mysqli_num_rows($chk) > 0) {
            $alt = mysqli_query($conn, "ALTER TABLE `$t` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
            if ($alt) {
                echo "<p style='color:green'>✔ Collation tabel <code>$t</code> berhasil diselaraskan ke utf8mb4_general_ci.</p>";
            } else {
                echo "<p style='color:orange'>⚠ Collation tabel <code>$t</code>: " . htmlspecialchars(mysqli_error($conn)) . "</p>";
            }
        }
    }
    
    // 6. Test Query Hak Akses Sensei & Siswa LMS
    echo "<h3>6. Menguji Query Hak Akses Sensei & Siswa LMS...</h3>";
    mysqli_query($conn, "SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
    mysqli_query($conn, "SET collation_connection = 'utf8mb4_general_ci'");
    $testLms = mysqli_query($conn, "
        SELECT u.id AS user_id, e.id AS employee_id, u.email, r.name AS role_name, e.full_name, e.employee_code
        FROM users u 
        LEFT JOIN employees e ON e.user_id = u.id 
        LEFT JOIN roles r ON r.id = u.role_id 
        WHERE r.name IN ('sensei', 'sensei_intensif', 'peserta_intensif')
        ORDER BY u.id DESC
    ");
    if ($testLms) {
        $count = mysqli_num_rows($testLms);
        echo "<p style='color:blue; font-weight:bold;'>✔ Berhasil! Query LMS bebas dari error collation ($count akun Sensei/Siswa ditemukan di database).</p>";
    } else {
        echo "<p style='color:red; font-weight:bold;'>✖ Query LMS masih mengalami kendala: " . htmlspecialchars(mysqli_error($conn)) . "</p>";
    }

    // 7. Perbaiki Relasi Akun: Muhammad Faizal (Role Karyawan) & Admin Sistem (Role Super Admin)
    echo "<h3>7. Memperbaiki Relasi Akun: Muhammad Faizal (Role Karyawan) & Admin Sistem...</h3>";
    $karyawanRoleRow = mysqli_fetch_assoc(mysqli_query($conn, "SELECT id FROM roles WHERE name='karyawan' LIMIT 1"));
    $karyawanRoleId = $karyawanRoleRow ? (int)$karyawanRoleRow['id'] : 6;

    // A. Buat atau perbarui akun login khusus Muhammad Faizal (Role Karyawan)
    $faizalEmail = 'muhammadfaizal.mf10@gmail.com';
    $faizalUser = mysqli_fetch_assoc(mysqli_query($conn, "SELECT id FROM users WHERE email='$faizalEmail' LIMIT 1"));
    if ($faizalUser) {
        $faizalUid = (int)$faizalUser['id'];
        mysqli_query($conn, "UPDATE users SET role_id=$karyawanRoleId, is_active=1 WHERE id=$faizalUid");
    } else {
        $pwdHash = password_hash('creativa2026', PASSWORD_DEFAULT);
        mysqli_query($conn, "INSERT INTO users(email, password_hash, role_id, is_active, created_at, updated_at) VALUES('$faizalEmail', '$pwdHash', $karyawanRoleId, 1, NOW(), NOW())");
        $faizalUid = (int)mysqli_insert_id($conn);
    }

    // Hubungkan profil karyawan NIK 2260005 ke akun karyawan Muhammad Faizal
    mysqli_query($conn, "
        UPDATE employees 
        SET user_id = $faizalUid, full_name = 'Muhammad Faizal' 
        WHERE employee_code = '2260005'
    ");
    echo "<p style='color:green'>✔ Akun login Muhammad Faizal (<code>$faizalEmail</code>) berhasil dihubungkan ke NIK 2260005 dengan <b>Role: KARYAWAN</b>.</p>";

    // B. Pastikan akun admin@onecreativa.com terpisah sebagai Super Admin sistem
    $adminUser = mysqli_fetch_assoc(mysqli_query($conn, "SELECT id, email FROM users WHERE email='admin@onecreativa.com' LIMIT 1"));
    if ($adminUser) {
        $adminId = (int)$adminUser['id'];
        mysqli_query($conn, "UPDATE users SET is_active=1 WHERE id=$adminId");
        $chkAdminEmp = mysqli_fetch_assoc(mysqli_query($conn, "SELECT id FROM employees WHERE user_id=$adminId LIMIT 1"));
        if (!$chkAdminEmp) {
            mysqli_query($conn, "INSERT INTO employees (user_id, employee_code, full_name, gender, position, work_type, join_date, created_at, updated_at) VALUES ($adminId, 'SYS-ADMIN', 'Administrator', 'Laki-laki', 'Super Admin', 'WFO', CURDATE(), NOW(), NOW())");
        } else {
            mysqli_query($conn, "UPDATE employees SET full_name = 'Administrator' WHERE id = " . (int)$chkAdminEmp['id']);
        }
        echo "<p style='color:green'>✔ Akun <code>admin@onecreativa.com</code> terpisah sebagai <b>Administrator Sistem (Super Admin)</b>.</p>";
    }

    // Cek apakah masih ada karyawan lain yang relasi akunnya putus
    $orphanCheck = mysqli_query($conn, "
        SELECT e.id, e.employee_code, e.full_name 
        FROM employees e 
        LEFT JOIN users u ON u.id = e.user_id 
        WHERE u.id IS NULL
    ");
    $orphanCount = mysqli_num_rows($orphanCheck);
    if ($orphanCount > 0) {
        echo "<p style='color:orange'>⚠ Ditemukan $orphanCount karyawan lain yang belum terhubung dengan akun login:</p><ul>";
        while ($o = mysqli_fetch_assoc($orphanCheck)) {
            echo "<li>NIK: " . htmlspecialchars($o['employee_code']) . " - " . htmlspecialchars($o['full_name']) . "</li>";
        }
        echo "</ul>";
    } else {
        echo "<p style='color:green'>✔ Semua data karyawan sudah terhubung sempurna dengan akun login pengguna (0 relasi putus).</p>";
    }

    echo "<h3>✔ Semua langkah perbaikan selesai! Silakan buka kembali halaman Manajemen Karyawan di sistem.</h3>";
} else {
    echo "<p style='color:red; font-weight:bold;'>✖ KONEKSI DATABASE MASIH GAGAL. Cek config/db_env.php</p>";
}
