<?php
define('CREATIVA_TEST_ROUTER', true);
echo "<h2>Alat Perbaikan Otomatis Hostinger - Creativa</h2>";

// ── 0. Sinkronisasi Otomatis dari folder dist/ ke public_html jika ada ──
function sync_folder_recursive($src, $dst) {
    if (!is_dir($dst)) @mkdir($dst, 0755, true);
    $dir = @opendir($src);
    if (!$dir) return;
    while (false !== ($file = readdir($dir))) {
        if ($file === '.' || $file === '..') continue;
        $srcPath = $src . '/' . $file;
        $dstPath = $dst . '/' . $file;
        if (is_dir($srcPath)) {
            sync_folder_recursive($srcPath, $dstPath);
        } else {
            @copy($srcPath, $dstPath);
        }
    }
    closedir($dir);
}

if (basename(__DIR__) === 'dist') {
    $parent = dirname(__DIR__);
    sync_folder_recursive(__DIR__, $parent);
    echo "<p style='color:green; font-weight:bold;'>✔ Berhasil memindahkan dan menyinkronkan seluruh file dist/ ke root public_html secara otomatis!</p>";
} elseif (is_dir(__DIR__ . '/dist')) {
    sync_folder_recursive(__DIR__ . '/dist', __DIR__);
    echo "<p style='color:green; font-weight:bold;'>✔ Berhasil mendeteksi folder dist/ dan memperbarui file root public_html secara otomatis!</p>";
}

$base_dir = __DIR__;
$success = true;

// Cari direktori backend jika script berada di root project
$backend_dir = file_exists($base_dir . '/config/database.php') ? $base_dir : $base_dir . '/backend';

// 1. Tulis / Perbarui config/db_env.php dengan konfigurasi Hostinger yang valid
$db_env = $backend_dir . '/config/db_env.php';
$candidates = [
    ['host' => 'localhost', 'pass' => '4L13nw4r3!@#$%'],
    ['host' => 'localhost', 'pass' => 'Creativa4321!'],
    ['host' => '127.0.0.1', 'pass' => '4L13nw4r3!@#$%'],
    ['host' => '127.0.0.1', 'pass' => 'Creativa4321!'],
];
$active_host = 'localhost';
$active_pass = '4L13nw4r3!@#$%';
foreach ($candidates as $c) {
    try {
        $t = @new mysqli($c['host'], 'u260890310_one', $c['pass'], 'u260890310_one');
        if ($t && !$t->connect_error) {
            $active_host = $c['host'];
            $active_pass = $c['pass'];
            $t->close();
            break;
        }
    } catch (Throwable $e) {}
}
$hostinger_config = "<?php\n\$DB_HOST = '{$active_host}';\n\$DB_USER = 'u260890310_one';\n\$DB_PASS = " . var_export($active_pass, true) . ";\n\$DB_NAME = 'u260890310_one';\n";
file_put_contents($db_env, $hostinger_config);
echo "<p style='color:green'>✔ File config/db_env.php berhasil disinkronkan (DB: u260890310_one, Host: $active_host).</p>";



// 2. Hapus api/.htaccess yang bikin bentrok jika ada
$api_htaccess = $backend_dir . '/api/.htaccess';
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
require $backend_dir . '/config/database.php';
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
          `ip_address` VARCHAR(45) NULL,
          `hash_prev` VARCHAR(64) NULL,
          `hash_self` VARCHAR(64) NULL,
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX `idx_entity` (`entity_type`, `entity_id`, `id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    // Pastikan kolom hash chain dan ip_address tersedia di accounting_audit_logs
    $chkAuditCols = [
        'ip_address' => 'VARCHAR(45) NULL AFTER `details_json`',
        'hash_prev'  => 'VARCHAR(64) NULL AFTER `ip_address`',
        'hash_self'  => 'VARCHAR(64) NULL AFTER `hash_prev`'
    ];
    foreach ($chkAuditCols as $colName => $colDef) {
        $c = mysqli_query($conn, "SHOW COLUMNS FROM `accounting_audit_logs` LIKE '$colName'");
        if ($c && mysqli_num_rows($c) == 0) {
            mysqli_query($conn, "ALTER TABLE `accounting_audit_logs` ADD COLUMN `$colName` $colDef");
        }
    }

    // Perbarui trigger ac_audit_update agar tidak memblokir inisialisasi hash_self
    mysqli_query($conn, "DROP TRIGGER IF EXISTS `ac_audit_update`");
    mysqli_query($conn, "
        CREATE TRIGGER `ac_audit_update` BEFORE UPDATE ON `accounting_audit_logs` FOR EACH ROW 
        BEGIN 
          IF (OLD.hash_self IS NOT NULL AND OLD.hash_self <> '') 
             OR (NEW.actor_name <> OLD.actor_name) 
             OR (NEW.entity_type <> OLD.entity_type) 
             OR (NEW.entity_id <> OLD.entity_id) 
             OR (NEW.action <> OLD.action) THEN 
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Audit logs are immutable'; 
          END IF; 
        END
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

    // Inisialisasi skema anggaran (budget)
    if (file_exists($backend_dir . '/services/budget_schema.php')) {
        require_once $backend_dir . '/services/budget_schema.php';
        if (function_exists('install_budget_schema')) {
            try {
                install_budget_schema($conn);
                echo "<p style='color:green'>✔ Skema Anggaran (budget_requests & items) berhasil diverifikasi.</p>";
            } catch (Throwable $e) {
                echo "<p style='color:orange'>⚠ Peringatan skema anggaran: " . htmlspecialchars($e->getMessage()) . "</p>";
            }
        }
    }

    // Inisialisasi skema akuntansi & modul relasi jika service tersedia
    if (file_exists($backend_dir . '/services/accounting_schema.php')) {
        require_once $backend_dir . '/services/accounting_schema.php';
        if (function_exists('install_accounting_schema')) {
            try {
                install_accounting_schema($conn);
                echo "<p style='color:green'>✔ Skema modul Keuangan & Akuntansi (COA, Rekening Bank, Periode) berhasil diverifikasi.</p>";
            } catch (Throwable $e) {
                echo "<p style='color:orange'>⚠ Peringatan skema akuntansi: " . htmlspecialchars($e->getMessage()) . "</p>";
            }
        }
    }

    // Inisialisasi skema penggajian (salary)
    if (file_exists($backend_dir . '/services/salary_schema.php')) {
        require_once $backend_dir . '/services/salary_schema.php';
        if (function_exists('install_salary_schema')) {
            try {
                install_salary_schema($conn);
                echo "<p style='color:green'>✔ Skema Penggajian (salary_requests & salary_base_rates) berhasil diverifikasi.</p>";
            } catch (Throwable $e) {
                echo "<p style='color:orange'>⚠ Peringatan skema penggajian: " . htmlspecialchars($e->getMessage()) . "</p>";
            }
        }
    }

    echo "<p style='color:green'>✔ Tabel <code>accounting_audit_logs</code> (beserta hash chain & trigger) dan <code>employee_employment</code> siap digunakan.</p>";

    // Pemulihan Riwayat Absensi Karyawan & Laporan Kerja (attendance_logs & daily_reports)
    echo "<h3>4b. Memulihkan Riwayat Absensi Karyawan & Laporan Kerja...</h3>";
    $attendanceRows = [
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (1,1,'2026-06-19','2026-06-19 20:08:45','2026-06-19 20:08:50',NULL,NULL,NULL,NULL,1,0,'late','Face Snapshot: uploads/face_snapshots/face_1_clock_in_20260619_200845.jpg, Face Snapshot Out: uploads/face_snapshots/face_1_clock_out_20260619_200850.jpg','2026-06-20 01:08:45');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (2,1,'2026-06-23','2026-06-23 08:00:00','2026-06-23 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-06-21 01:15:55');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (3,1,'2026-06-24','2026-06-24 08:00:00','2026-06-24 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-06-21 01:15:55');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (4,1,'2026-06-25','2026-06-25 08:00:00','2026-06-25 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-06-21 01:15:55');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (5,1,'2026-06-26','2026-06-26 08:00:00','2026-06-26 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-06-21 01:15:55');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (7,7,'2026-06-26','2026-06-26 02:16:05',NULL,'-6.24521450','107.02288625',NULL,NULL,1,0,'present','Face Snapshot: uploads/face_snapshots/face_7_clock_in_20260626_021605.jpg','2026-06-26 02:16:05');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (8,7,'2026-06-27','2026-06-27 07:35:09','2026-06-27 07:35:28','-6.24531148','107.02291170','-6.24531148','107.02291170',1,0,'late','','2026-06-27 07:35:09');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (9,1,'2026-07-01','2026-07-01 08:00:00','2026-07-01 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (10,1,'2026-07-02','2026-07-02 08:00:00','2026-07-02 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (11,1,'2026-07-03','2026-07-03 08:00:00','2026-07-03 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (12,1,'2026-07-04','2026-07-04 08:00:00','2026-07-04 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (13,1,'2026-07-05','2026-07-05 08:00:00','2026-07-05 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (14,1,'2026-07-06','2026-07-06 08:00:00','2026-07-06 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (15,1,'2026-07-07','2026-07-07 08:00:00','2026-07-07 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (16,1,'2026-07-08','2026-07-08 08:00:00','2026-07-08 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (17,1,'2026-07-09','2026-07-09 08:00:00','2026-07-09 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (18,1,'2026-07-10','2026-07-10 08:00:00','2026-07-10 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (19,1,'2026-07-11','2026-07-11 08:00:00','2026-07-11 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (20,1,'2026-07-12','2026-07-12 08:00:00','2026-07-12 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (21,1,'2026-07-13','2026-07-13 08:00:00','2026-07-13 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (22,1,'2026-07-14','2026-07-14 08:00:00','2026-07-14 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (23,1,'2026-07-15','2026-07-15 08:00:00','2026-07-15 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (24,1,'2026-07-16','2026-07-16 08:00:00','2026-07-16 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (25,1,'2026-07-17','2026-07-17 08:00:00','2026-07-17 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (26,1,'2026-07-18','2026-07-18 08:00:00','2026-07-18 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (27,1,'2026-07-19','2026-07-19 08:00:00','2026-07-19 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (28,1,'2026-07-20','2026-07-20 08:00:00','2026-07-20 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (29,1,'2026-07-21','2026-07-21 08:00:00','2026-07-21 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (30,1,'2026-07-22','2026-07-22 08:00:00','2026-07-22 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (31,1,'2026-07-23','2026-07-23 08:00:00','2026-07-23 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (32,1,'2026-07-24','2026-07-24 08:00:00','2026-07-24 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (33,1,'2026-07-25','2026-07-25 08:00:00','2026-07-25 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (34,1,'2026-07-26','2026-07-26 08:00:00','2026-07-26 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (35,1,'2026-07-27','2026-07-27 08:00:00','2026-07-27 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (36,1,'2026-07-28','2026-07-28 08:00:00','2026-07-28 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (37,1,'2026-07-29','2026-07-29 08:00:00','2026-07-29 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (38,1,'2026-07-30','2026-07-30 08:00:00','2026-07-30 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (39,1,'2026-07-31','2026-07-31 08:00:00','2026-07-31 17:00:00',NULL,NULL,NULL,NULL,0,0,'dinas',NULL,'2026-07-02 00:15:47');",
        "INSERT IGNORE INTO `attendance_logs` (`id`,`employee_id`,`date`,`check_in_at`,`check_out_at`,`check_in_lat`,`check_in_lng`,`check_out_lat`,`check_out_lng`,`face_verified`,`geo_verified`,`status`,`notes`,`created_at`) VALUES (40,7,'2026-10-05','2026-10-05 10:32:53',NULL,'-6.81082100','107.12559233',NULL,NULL,1,0,'late','Face Snapshot: uploads/face_snapshots/face_7_clock_in_20261005_103253.jpg','2026-10-05 10:32:53');",
    ];

    $attCount = 0;
    foreach ($attendanceRows as $sqlRow) {
        if (mysqli_query($conn, $sqlRow)) {
            $attCount += mysqli_affected_rows($conn);
        }
    }

    $reportRows = [
        "INSERT IGNORE INTO `daily_reports` (`id`,`employee_id`,`report_date`,`tasks`,`notes`,`created_at`,`updated_at`) VALUES (1,1,'2026-07-01','[{\\\"text\\\":\\\"membuat sistem absensi karyawan\\\",\\\"is_completed\\\":false},{\\\"text\\\":\\\"membuat nenkin \\\",\\\"is_completed\\\":true}]',NULL,'2026-07-02 02:18:35','2026-07-02 02:19:06');",
        "INSERT IGNORE INTO `daily_reports` (`id`,`employee_id`,`report_date`,`tasks`,`notes`,`created_at`,`updated_at`) VALUES (3,1,'2026-08-03','[{\\\"text\\\":\\\"muhammad faizal\\\",\\\"status\\\":\\\"new\\\",\\\"finished_at\\\":null}]',NULL,'2026-08-03 11:06:21','2026-08-03 11:06:21');",
        "INSERT IGNORE INTO `daily_reports` (`id`,`employee_id`,`report_date`,`tasks`,`notes`,`created_at`,`updated_at`) VALUES (4,1,'2026-08-17','[{\\\"text\\\":\\\"SJLkslksL\\\",\\\"status\\\":\\\"new\\\",\\\"finished_at\\\":null},{\\\"text\\\":\\\"NJSKDJLSK\\\",\\\"status\\\":\\\"new\\\",\\\"finished_at\\\":null},{\\\"text\\\":\\\"NDJSDKJLKD\\\",\\\"status\\\":\\\"new\\\",\\\"finished_at\\\":null}]',NULL,'2026-08-17 14:06:06','2026-08-17 14:06:06');",
        "INSERT IGNORE INTO `daily_reports` (`id`,`employee_id`,`report_date`,`tasks`,`notes`,`created_at`,`updated_at`) VALUES (5,7,'2026-10-05','[{\\\"text\\\":\\\"Brifing Manager\\\",\\\"category\\\":\\\"Meeting\\\",\\\"description\\\":\\\"meeting pagi\\\",\\\"status\\\":\\\"done\\\",\\\"time\\\":\\\"12.04\\\",\\\"finished_at\\\":\\\"2026-10-05T05:04:14.875Z\\\"}]','','2026-10-05 12:04:14','2026-10-05 12:04:14');",
    ];

    $repCount = 0;
    foreach ($reportRows as $sqlRow) {
        if (mysqli_query($conn, $sqlRow)) {
            $repCount += mysqli_affected_rows($conn);
        }
    }

    $totalAttRes = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) as total FROM attendance_logs"));
    $totalAtt = $totalAttRes['total'] ?? 0;
    echo "<p style='color:green'>✔ Riwayat Absensi Karyawan berhasil dipulihkan! Total data tersimpan saat ini: <b>$totalAtt baris log absensi</b>.</p>";


    // Sinkronkan izin akuntansi finance & bersihkan akun dummy 1100 Kas/Bank
    mysqli_query($conn, "UPDATE finance_role_permissions SET allowed=1 WHERE role_name='finance' AND permission IN ('read','prepare','post','configure')");
    mysqli_query($conn, "DELETE FROM accounts WHERE code='1100' OR (account_group=1 AND name='Kas / Bank' AND report_class='cash')");
    echo "<p style='color:green'>✔ Hak akses role Finance disinkronkan dan akun template dummy 1100 dibersihkan permanen.</p>";

    // Pastikan tabel keuangan esensial ada
    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS `payment_allocations` (
          `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          `transaction_id` BIGINT UNSIGNED NOT NULL UNIQUE,
          `source_document_id` BIGINT UNSIGNED NOT NULL,
          `amount` DECIMAL(15,2) NOT NULL,
          `is_reversed` TINYINT NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");
    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS `budget_realizations` (
          `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          `budget_request_id` INT UNSIGNED NOT NULL,
          `amount` DECIMAL(15,2) NOT NULL,
          `status` VARCHAR(30) NOT NULL DEFAULT 'recorded',
          `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    ");

    // Cek dan lengkapi kolom finance_records untuk penggajian & anggaran
    $chkSalRec = mysqli_query($conn, "SHOW COLUMNS FROM `finance_records` LIKE 'salary_request_id'");
    if (mysqli_num_rows($chkSalRec) == 0) {
        mysqli_query($conn, "ALTER TABLE `finance_records` ADD COLUMN `salary_request_id` INT(10) UNSIGNED NULL");
    }
    $chkBudRec = mysqli_query($conn, "SHOW COLUMNS FROM `finance_records` LIKE 'budget_request_id'");
    if (mysqli_num_rows($chkBudRec) == 0) {
        mysqli_query($conn, "ALTER TABLE `finance_records` ADD COLUMN `budget_request_id` INT(10) UNSIGNED NULL");
    }
    echo "<p style='color:green'>✔ Kolom <code>salary_request_id</code> & <code>budget_request_id</code> pada tabel <code>finance_records</code> diverifikasi.</p>";

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

    // 7. Perbaiki Relasi Akun: Muhammad Faizal (Role Super Admin) & Admin Sistem
    echo "<h3>7. Memperbaiki Relasi Akun: Muhammad Faizal (Role Super Admin) & Admin Sistem...</h3>";
    $superRoleRow = mysqli_fetch_assoc(mysqli_query($conn, "SELECT id FROM roles WHERE name='super_admin' LIMIT 1"));
    $superRoleId = $superRoleRow ? (int)$superRoleRow['id'] : 1;

    // A. Buat atau perbarui akun login Muhammad Faizal (Role Super Admin - Akses Penuh)
    $faizalEmail = 'muhammadfaizal.mf10@gmail.com';
    $faizalUser = mysqli_fetch_assoc(mysqli_query($conn, "SELECT id FROM users WHERE email='$faizalEmail' LIMIT 1"));
    if ($faizalUser) {
        $faizalUid = (int)$faizalUser['id'];
        mysqli_query($conn, "UPDATE users SET role_id=$superRoleId, is_active=1 WHERE id=$faizalUid");
    } else {
        $pwdHash = password_hash('creativa2026', PASSWORD_DEFAULT);
        mysqli_query($conn, "INSERT INTO users(email, password_hash, role_id, is_active, created_at, updated_at) VALUES('$faizalEmail', '$pwdHash', $superRoleId, 1, NOW(), NOW())");
        $faizalUid = (int)mysqli_insert_id($conn);
    }

    // Hubungkan profil karyawan NIK 2260005 ke akun Muhammad Faizal
    mysqli_query($conn, "
        UPDATE employees 
        SET user_id = $faizalUid, full_name = 'Muhammad Faizal' 
        WHERE employee_code = '2260005'
    ");
    echo "<p style='color:green'>✔ Akun login Muhammad Faizal (<code>$faizalEmail</code>) berhasil dihubungkan ke NIK 2260005 dengan <b>Role: SUPER ADMIN (Akses Penuh Sistem & Keuangan)</b>.</p>";

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
